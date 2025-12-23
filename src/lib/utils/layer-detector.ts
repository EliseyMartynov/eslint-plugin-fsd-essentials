import { FSD_LAYERS } from '../constants';
import {
  extractLayerAndSliceFromImport,
  extractLayerAndSliceFromPath,
  LayerSliceInfo,
} from './path-utils';

/**
 * Определяет слой FSD по пути к файлу
 */
export function detectLayerByPath(filePath: string, srcPath: string): string | null {
  const normalizedSrcPath = srcPath.replace(/\\/g, '/');
  const normalizedFilePath = filePath.replace(/\\/g, '/');

  if (!normalizedFilePath.includes(normalizedSrcPath)) {
    return null;
  }

  const srcIndex = normalizedFilePath.indexOf(normalizedSrcPath);
  const afterSrc = normalizedFilePath.substring(srcIndex + normalizedSrcPath.length);
  const parts = afterSrc.split('/');

  if (parts.length === 0) return null;

  const layer = parts[0];
  const possibleLayers = Object.keys(FSD_LAYERS);

  return possibleLayers.includes(layer) ? layer : null;
}

/**
 * Определяет слой FSD по импорту
 */
export function detectLayerByImport(
  importPath: string,
  aliasMap: Record<string, string>
): string | null {
  for (const [alias, layer] of Object.entries(aliasMap)) {
    if (importPath.startsWith(alias + '/')) {
      return layer;
    }
  }

  if (importPath.startsWith('.')) {
    return null;
  }

  return 'external';
}

/**
 * Проверяет, находятся ли два пути в одном слайсе
 */
export function isSameSlice(path1: string, path2: string, srcPath: string): boolean {
  const info1: LayerSliceInfo | null = path1.startsWith('@')
    ? extractLayerAndSliceFromImport(path1)
    : extractLayerAndSliceFromPath(path1, srcPath);

  const info2: LayerSliceInfo | null = path2.startsWith('@')
    ? extractLayerAndSliceFromImport(path2)
    : extractLayerAndSliceFromPath(path2, srcPath);

  if (!info1 || !info2) return false;

  return info1.layer === info2.layer && info1.slice === info2.slice;
}
