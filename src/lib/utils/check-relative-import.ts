import path from 'path';
import { isSameSlice, detectLayerByPath } from './layer-detector';
import { normalizePath } from './path-utils';

export interface RelativeImportCheck {
  isRelative: boolean;
  isAllowed: boolean;
  sameSlice: boolean;
}

/**
 * Проверяет относительные импорты
 */
export function checkRelativeImport(
  importPath: string,
  currentFilePath: string,
  nonSliceableLayers: string[],
  srcPath: string
): RelativeImportCheck {
  if (!importPath.startsWith('.')) {
    return { isRelative: false, isAllowed: false, sameSlice: false };
  }

  const currentDir = path.dirname(currentFilePath);
  const importedFullPath = path.resolve(currentDir, importPath);

  const currentLayer = detectLayerByPath(currentFilePath, srcPath);
  const importedLayer = detectLayerByPath(normalizePath(importedFullPath), srcPath);

  const sameSlice = isSameSlice(currentFilePath, importedFullPath, srcPath);
  const nonSliceableAndSameLayer =
    currentLayer &&
    importedLayer &&
    nonSliceableLayers.includes(currentLayer) &&
    currentLayer === importedLayer;

  const isAllowed = sameSlice || !!nonSliceableAndSameLayer;

  return {
    isRelative: true,
    isAllowed,
    sameSlice,
  };
}
