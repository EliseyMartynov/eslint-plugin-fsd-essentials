import path from 'path';
import { extractLayerAndSliceFromImport, extractLayerAndSliceFromPath } from './path-utils';
import { getSliceRoot } from './get-slice-root';

/**
 * Преобразует абсолютный импорт внутри слайса в относительный путь
 */
export function convertToRelativePath(
  absoluteImport: string,
  currentFilePath: string,
  srcPath: string
): string {
  if (!absoluteImport.startsWith('@')) return absoluteImport;

  const importInfo = extractLayerAndSliceFromImport(absoluteImport);
  if (!importInfo) return absoluteImport;

  const currentInfo = extractLayerAndSliceFromPath(currentFilePath, srcPath);
  if (!currentInfo) return absoluteImport;

  if (importInfo.layer !== currentInfo.layer || importInfo.slice !== currentInfo.slice) {
    return absoluteImport;
  }

  const withoutAt = absoluteImport.substring(1);
  const parts = withoutAt.split('/');

  if (parts.length === 2) {
    return '../index';
  }

  const pathInsideSlice = parts.slice(2).join('/');
  const currentDir = path.dirname(currentFilePath);
  const sliceRoot = getSliceRoot(currentFilePath, srcPath);

  if (!sliceRoot) return absoluteImport;

  const importedFullPath = path.join(sliceRoot, pathInsideSlice);
  let relativePath = path.relative(currentDir, importedFullPath);

  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  relativePath = relativePath.replace(/\.(ts|tsx)$/, '');
  return relativePath.replace(/\\/g, '/');
}
