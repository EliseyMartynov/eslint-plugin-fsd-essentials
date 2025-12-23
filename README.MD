# eslint-plugin-fsd-essentials

[![npm version](https://img.shields.io/npm/v/eslint-plugin-fsd-essentials.svg)](https://www.npmjs.com/package/eslint-plugin-fsd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ESLint плагин для валидации архитектуры Feature-Sliced Design (FSD). Обеспечивает соблюдение правил импортов между слоями FSD.

✅ Проверяет иерархию импортов FSD

🔧 Автофиксы для абсолютных импортов внутри слайса

🫰 Работает с динамическими импортами

⚙️ Гибкая конфигурация

🧪 Полное покрытие тестами

📦 Не требует зависимостей кроме ESLint


## 📦 Установка

```bash
npm install --save-dev eslint-plugin-fsd-essentials
```

## 🚀 Быстрый старт

### 1. Настройка ESLint

Добавьте плагин в ваш ESLint конфиг:

```javascript
// .eslintrc.js
module.exports = {
    plugins: ['fsd'],
    extends: [
        'plugin:fsd/recommended'
    ]
};
```

Или с кастомной конфигурацией:

```javascript
// .eslintrc.js
module.exports = {
    plugins: ['fsd'],
    rules: {
        'fsd/layer-imports': ['error', {
            srcPath: '/src/',
            aliasPrefix: '@',
        }],
    },
};
```

### 2. Настройка TypeScript


```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/app/*"],
      "@processes/*": ["src/processes/*"],
      "@pages/*": ["src/pages/*"],
      "@widgets/*": ["src/widgets/*"],
      "@features/*": ["src/features/*"],
      "@entities/*": ["src/entities/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

## 📖 Что проверяет плагин

### ✅ Правильные импорты

```typescript
// features/auth/ui.tsx → entities/user
import { userModel } from '@entities/user'; // ✅ Правильно через Public API и в соответствии с иерархией слоев

// entities/user/ui.tsx → entities/user/model
import { model } from './model'; // ✅ Правильно относительный импорт внутри слайса

// app/index.tsx → app/providers.ts
import { Provider } from './providers'; // ✅ Слои app и shared не содержат слайсов. Работает из коробки
```

### ❌ Неправильные импорты

```typescript
// entities/user/model.ts → app
import { config } from '@app/config'; // ❌ entities не может импортировать app

// app/index.ts → entities/user/model
import { model } from '@entities/user/model'; // ❌ Нарушение Public API

// app/index.ts → entities/user
import { user } from '../../entities/user'; // ❌ Относительный импорт между слоями
```

### Готовые конфигурации

Плагин предоставляет предустановленные конфигурации:

```javascript
// Рекомендуемая конфигурация
extends: ['plugin:fsd/recommended']
    
// Содержит по умолчанию
// srcPath: '/src/'
// aliasPrefix: '@'
        
```

## 🔗 Полезные ссылки

- [Feature-Sliced Design](https://feature-sliced.design/) - Официальная документация FSD
