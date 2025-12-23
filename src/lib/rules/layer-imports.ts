import { Rule } from 'eslint';
import { FSD_LAYERS, NON_SLICEABLE_LAYERS, SEGMENTS, ALIAS_MAP, PluginOptions } from '../constants';
import { normalizePath } from '../utils/path-utils';
import {
  detectLayerByPath,
  detectLayerByImport,
  isSameSlice as isSameSliceFn,
} from '../utils/layer-detector';
import { checkRelativeImport } from '../utils/check-relative-import';
import { convertToRelativePath } from '../utils/convert-to-relative-path';
import { isPublicApiImport } from '../utils/is-public-api';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Feature-Sliced Design layer import rules',
      category: 'Architecture' as any,
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          srcPath: {
            type: 'string',
            description: 'Путь к src директории относительно корня проекта',
            default: '/src/',
          },
          aliasPrefix: {
            type: 'string',
            description: 'Префикс для алиасов (например @ или ~)',
            default: '@',
          },
          layers: {
            type: 'object',
            description: 'Настройки слоев FSD',
            default: FSD_LAYERS,
          },
          nonSliceableLayers: {
            type: 'array',
            description: 'Слои, которые не имеют слайсов',
            default: NON_SLICEABLE_LAYERS,
          },
          segments: {
            type: 'array',
            description: 'Сегменты FSD (ui, model, lib и т.д.)',
            default: SEGMENTS,
          },
          aliasMap: {
            type: 'object',
            description: 'Карта алиасов для импортов',
            default: ALIAS_MAP,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidImport:
        'FSD violation: {{currentLayer}} cannot import from {{importedLayer}}. {{message}}',
      unknownLayer: 'FSD: Cannot determine layer for import "{{importPath}}"',
      relativeImportViolation:
        'FSD violation: Relative import "{{importPath}}" is only allowed within the same slice.',
      publicApiViolation:
        'FSD Public API violation: Cross-slice import must be through index.ts file.',
      absoluteWithinSlice: 'FSD Absolute import inside same slice.',
    },
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options: PluginOptions = context.options[0] || {};
    const config = {
      srcPath: options.srcPath || '/src/',
      aliasPrefix: options.aliasPrefix || '@',
      layers: options.layers || FSD_LAYERS,
      nonSliceableLayers: options.nonSliceableLayers || NON_SLICEABLE_LAYERS,
      segments: options.segments || SEGMENTS,
      aliasMap: options.aliasMap || ALIAS_MAP,
    };

    const currentFilePath = normalizePath(context.getFilename());
    const currentLayer = detectLayerByPath(currentFilePath, config.srcPath);

    if (!currentFilePath.includes(config.srcPath)) {
      return {};
    }

    if (!currentLayer) {
      return {};
    }

    const allowedLayers = config.layers[currentLayer]?.allowed || [];

    const validateImport = (node: any) => {
      const importPath = node.source.value;

      if (importPath.startsWith('.')) {
        const relativeCheck = checkRelativeImport(
          importPath,
          currentFilePath,
          config.nonSliceableLayers,
          config.srcPath
        );

        if (!relativeCheck.isAllowed) {
          context.report({
            node,
            messageId: 'relativeImportViolation',
            data: { importPath },
          });
        }
        return;
      }

      if (!importPath.startsWith('@') && !importPath.startsWith('.')) {
        return;
      }

      const importedLayer = detectLayerByImport(importPath, config.aliasMap);

      if (!importedLayer || importedLayer === 'external') {
        return;
      }

      const validLayers = Object.keys(config.layers);
      if (!validLayers.includes(importedLayer)) {
        return;
      }

      const isSameSlice = isSameSliceFn(importPath, currentFilePath, config.srcPath);

      if (isSameSlice) {
        const relativePath = convertToRelativePath(importPath, currentFilePath, config.srcPath);

        context.report({
          node,
          messageId: 'absoluteWithinSlice',
          data: {
            absolutePath: importPath,
            relativePath,
          },
          fix(fixer) {
            return fixer.replaceText(node.source, `'${relativePath}'`);
          },
        });
        return;
      }

      if (
        !isPublicApiImport(
          importPath,
          currentFilePath,
          importedLayer,
          config.aliasPrefix,
          config.aliasMap,
          config.srcPath
        ) &&
        !isSameSlice
      ) {
        context.report({
          node,
          messageId: 'publicApiViolation',
          data: { importPath },
        });
      }

      if (!allowedLayers.includes(importedLayer) && !isSameSlice) {
        const layerRule = config.layers[currentLayer];

        context.report({
          node,
          messageId: 'invalidImport',
          data: {
            currentLayer,
            importedLayer,
            message: layerRule?.message || `Allowed layers: ${allowedLayers.join(', ')}`,
          },
        });
      }
    };

    return {
      ImportDeclaration(node) {
        validateImport(node);
      },
      ImportExpression(node) {
        if (node.source?.type === 'Literal' && typeof node.source.value === 'string') {
          validateImport(node);
        }
      },
    };
  },
};

export default rule;
