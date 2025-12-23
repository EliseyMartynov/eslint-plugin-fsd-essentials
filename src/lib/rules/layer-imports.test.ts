import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import rule from './layer-imports';

// Хелпер для создания тестовых путей
function createTestPath(layer, slice = '', file = '') {
  const parts = ['/src', layer];
  if (slice) parts.push(slice);
  if (file) parts.push(file);
  return parts.join('/') + '.ts';
}

describe('FSD Plugin Tests', () => {
  const linter = new Linter();
  linter.defineRule('layer-imports', rule);

  const config = {
    rules: {
      'layer-imports': [
        'error',
        {},
      ],
    },
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  };

  // Вспомогательная функция для запуска теста
  const runTest = (code, filename, expectedErrorCount = 0, expectedMessageIds = []) => {
    const results = linter.verify(code, config, filename);

    if (expectedErrorCount === 0) {
      if (results.length > 0) {
        throw new Error(
          `Expected no errors, but got ${results.length}: ${JSON.stringify(results, null, 2)}`
        );
      }
    } else {
      if (results.length !== expectedErrorCount) {
        throw new Error(
          `Expected ${expectedErrorCount} errors, but got ${results.length}: ${JSON.stringify(results, null, 2)}`
        );
      }

      if (expectedMessageIds.length > 0) {
        results.forEach((result, index) => {
          if (result.messageId !== expectedMessageIds[index]) {
            throw new Error(
              `Expected messageId "${expectedMessageIds[index]}" at position ${index}, but got "${result.messageId}"`
            );
          }
        });
      }
    }

    return results;
  };

  describe('1. Импорт между слоями через Public API (разрешено)', () => {
    it('app → entities через Public API должен быть разрешен', () => {
      runTest(`import { test } from '@entities/test';`, createTestPath('app', '', 'index'), 0);
    });

    it('features → entities через Public API должен быть разрешен', () => {
      runTest(
        `import { test } from '@entities/test';`,
        createTestPath('features', 'auth', 'index'),
        0
      );
    });

    it('widgets → features через Public API должен быть разрешен', () => {
      runTest(
        `import { test } from '@features/auth';`,
        createTestPath('widgets', 'header', 'index'),
        0
      );
    });

    it('pages → widgets через Public API должен быть разрешен', () => {
      runTest(
        `import { test } from '@widgets/header';`,
        createTestPath('pages', 'main', 'index'),
        0
      );
    });

    describe('1.1. Нарушения Public API (запрещено)', () => {
      it('app → entities не через Public API должен быть запрещен', () => {
        runTest(
          `import { test } from '@entities/test/test';`,
          createTestPath('app', '', 'index'),
          1,
          ['publicApiViolation']
        );
      });

      it('features → entities не через Public API должен быть запрещен', () => {
        runTest(
          `import { test } from '@entities/test/model';`,
          createTestPath('features', 'auth', 'index'),
          1,
          ['publicApiViolation']
        );
      });

      it('widgets → features не через Public API должен быть запрещен', () => {
        runTest(
          `import { test } from '@features/auth/model';`,
          createTestPath('widgets', 'header', 'index'),
          1,
          ['publicApiViolation']
        );
      });

      it('pages → widgets не через Public API должен быть запрещен', () => {
        runTest(
          `import { test } from '@widgets/header/components';`,
          createTestPath('pages', 'main', 'index'),
          1,
          ['publicApiViolation']
        );
      });
    });
  });

  describe('2. Относительные импорты внутри слоя (разрешено)', () => {
    it('Относительный импорт внутри app должен быть разрешен', () => {
      runTest(`import { test } from './providers';`, createTestPath('app', '', 'index'), 0);
    });

    it('Относительный импорт внутри shared должен быть разрешен', () => {
      runTest(`import { test } from '../lib';`, createTestPath('shared', 'api', 'index'), 0);
    });

    it('Относительный импорт внутри одного слайса entities должен быть разрешен', () => {
      runTest(`import { model } from './model';`, createTestPath('entities', 'user', 'ui'), 0);
    });

    it('Относительный импорт на уровень выше внутри слайса должен быть разрешен', () => {
      runTest(
        `import { types } from '../types';`,
        createTestPath('entities', 'user/model', 'store'),
        0
      );
    });

    describe('2.1. Относительные импорты между разными слоями (запрещено)', () => {
      it('app → entities через относительный путь должен быть запрещен', () => {
        runTest(
          `import { test } from '../entities/test/test';`,
          createTestPath('app', '', 'index'),
          1,
          ['relativeImportViolation']
        );
      });

      it('app → features через относительный путь должен быть запрещен', () => {
        runTest(
          `import { auth } from '../../features/auth';`,
          createTestPath('app', 'providers', 'store'),
          1,
          ['relativeImportViolation']
        );
      });

      it('shared → entities через относительный путь должен быть запрещен', () => {
        runTest(
          `import { user } from '../../entities/user';`,
          createTestPath('shared', 'ui', 'components'),
          1,
          ['relativeImportViolation']
        );
      });

      it('entities → app через относительный путь должен быть запрещен', () => {
        runTest(
          `import { config } from '../../app/providers';`,
          createTestPath('entities', 'user', 'model'),
          1,
          ['relativeImportViolation']
        );
      });

      it('features → shared через относительный путь должен быть запрещен', () => {
        runTest(
          `import { api } from '../../shared/api';`,
          createTestPath('features', 'auth', 'model'),
          1,
          ['relativeImportViolation']
        );
        // Примечание: features может импортировать shared через абсолютный путь
      });
    });
  });

  describe('3. Автофикс абсолютных импортов внутри слайса', () => {
    it('Должен сообщать об ошибке absoluteWithinSlice для @entities/test/file2 → ./file2', () => {
      const results = runTest(
        `import { test } from '@entities/test/file2';`,
        createTestPath('entities', 'test', 'file1'),
        1,
        ['absoluteWithinSlice']
      );

      console.log();

      expect(results?.[0]?.fix?.text).toBe("'./file2'");
    });

    it('Должен сообщать об ошибке absoluteWithinSlice для @entities/test/file2 → ../file2 из поддиректории', () => {
      const results = runTest(
        `import { test } from '@entities/test/file2';`,
        createTestPath('entities', 'test/ui', 'file1'),
        1,
        ['absoluteWithinSlice']
      );

      expect(results?.[0]?.fix?.text).toBe("'../file2'");
    });

    it('Должен сообщать об ошибке absoluteWithinSlice для @entities/test → ../index при импорте index', () => {
      const results = runTest(
        `import { test } from '@entities/test';`,
        createTestPath('entities', 'test/ui', 'component'),
        1,
        ['absoluteWithinSlice']
      );

      expect(results?.[0]?.fix?.text).toBe("'../index'");
    });
  });

  describe('4. Кросс-импорт между слайсами (запрещено)', () => {
    it('entities/test → entities/test2 должен быть запрещен с ошибкой publicApiViolation и invalidImport', () => {
      runTest(
        `import { test } from '@entities/test2/file2';`,
        createTestPath('entities', 'test/ui', 'file1'),
        2,
        ['publicApiViolation', 'invalidImport']
      );
    });

    it('Относительный импорт entities/test → entities/test2 должен быть запрещен', () => {
      runTest(
        `import { test } from '../../test2/file2';`,
        createTestPath('entities', 'test/ui', 'file1'),
        1,
        ['relativeImportViolation']
      );
    });

    it('features/auth → features/profile должен быть запрещен', () => {
      runTest(
        `import { test } from '@features/profile';`,
        createTestPath('features', 'auth', 'index'),
        1,
        ['invalidImport']
      );
    });
  });

  describe('5. Нарушения иерархии слоев (запрещено)', () => {
    it('entities → app должен быть запрещен', () => {
      runTest(`import { test } from '@app/test';`, createTestPath('entities', 'test', 'file'), 1, [
        'invalidImport',
      ]);
    });

    it('entities → processes должен быть запрещен', () => {
      runTest(
        `import { test } from '@processes/routing';`,
        createTestPath('entities', 'user', 'model'),
        1,
        ['invalidImport']
      );
    });

    it('features → widgets должен быть запрещен', () => {
      runTest(
        `import { test } from '@widgets/header';`,
        createTestPath('features', 'auth', 'index'),
        1,
        ['invalidImport']
      );
    });

    it('widgets → pages должен быть запрещен', () => {
      runTest(
        `import { test } from '@pages/main';`,
        createTestPath('widgets', 'header', 'index'),
        1,
        ['invalidImport']
      );
    });

    it('entities → features должен быть запрещен', () => {
      runTest(
        `import { test } from '@features/auth';`,
        createTestPath('entities', 'user', 'model'),
        1,
        ['invalidImport']
      );
    });
  });

  describe('6. Особые случаи shared слоя', () => {
    it('shared может импортировать внутри shared через Public API', () => {
      runTest(
        `import { test } from '@shared/api';`,
        createTestPath('shared', 'ui', 'component'),
        0
      );
    });

    it('shared не может импортировать внутри shared не через Public API', () => {
      runTest(
        `import { test } from '@shared/api/client';`,
        createTestPath('shared', 'ui', 'component'),
        1,
        ['publicApiViolation']
      );
    });

    it('Любой слой может импортировать из shared через Public API', () => {
      runTest(`import { test } from '@shared/api';`, createTestPath('app', '', 'index'), 0);
    });

    it('Любой слой НЕ может импортировать из shared НЕ через Public API', () => {
      runTest(
        `import { test } from '@shared/lib/helpers';`,
        createTestPath('entities', 'user', 'model'),
        1,
        ['publicApiViolation']
      );
    });
  });

  describe('7. Внешние зависимости (игнорируются)', () => {
    it('Внешние зависимости должны игнорироваться', () => {
      runTest(`import React from 'react';`, createTestPath('app', '', 'index'), 0);
    });
  });

  describe('8. Пограничные случаи', () => {
    it('Файлы вне src должны игнорироваться', () => {
      runTest(`import { test } from '@entities/test';`, 'config/vite.config.ts', 0);
    });

    it('Некорректные слои должны игнорироваться', () => {
      runTest(`import { test } from '@unknown/something';`, createTestPath('app', '', 'index'), 0);
    });

    it('Пустой импорт должен обрабатываться', () => {
      runTest(`import 'styles.css';`, createTestPath('app', '', 'index'), 0);
    });

    it('Динамический импорт без нарушения', () => {
      runTest(
        `const module = await import('@entities/test');`,
        createTestPath('app', '', 'index'),
        0
      );
    });

    it('Динамический импорт с нарушением', () => {
      runTest(
        `const module = await import('@entities/test/test');`,
        createTestPath('app', '', 'index'),
        1,
        ['publicApiViolation']
      );
    });
  });

  describe('9. Сложные сценарии', () => {
    it('Правильные импорты в одном файле', () => {
      runTest(
        `
        import React from 'react';
        import { store } from '@entities/user';
        import { auth } from '@features/auth';
        import { api } from '@shared/api';
        import './styles.css';
        `,
        createTestPath('widgets', 'user-profile', 'index'),
        0
      );
    });

    it('Смешанные правильные и неправильные импорты', () => {
      const results = runTest(
        `
        import { correct } from '@entities/user';
        import { wrong1 } from '@entities/user/model';
        import { wrong2 } from '@app/providers';
        `,
        createTestPath('features', 'profile', 'index'),
        2
      );

      // Проверяем типы ошибок
      const messageIds = results.map((r) => r.messageId);
      if (!messageIds.includes('publicApiViolation') || !messageIds.includes('invalidImport')) {
        throw new Error(
          `Expected publicApiViolation and invalidImport, but got: ${messageIds.join(', ')}`
        );
      }
    });
  });
});
