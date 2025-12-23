export const normalizePath = (filePath: string): string => 
  filePath.replace(/\\/g, '/');

export interface LayerSliceInfo {
  layer: string;
  slice: string;
  fullPath: string;
}

/**
 * Извлекает слой и слайс из физического пути
 */
export function extractLayerAndSliceFromPath(
  filePath: string, 
  srcPath: string = '/src/'
): LayerSliceInfo | null {
  const normalized = normalizePath(filePath);
  const normalizedSrcPath = normalizePath(srcPath);
  const srcIndex = normalized.indexOf(normalizedSrcPath);

  if (srcIndex === -1) return null;

  const afterSrc = normalized.substring(srcIndex + normalizedSrcPath.length);
  const parts = afterSrc.split('/');

  if (parts.length < 2) return null;

  return {
    layer: parts[0],
    slice: parts[1],
    fullPath: parts[0] + '/' + parts[1],
  };
}

/**
 * Извлекает слой и слайс из импортного пути
 */
export function extractLayerAndSliceFromImport(
  importPath: string, 
  aliasPrefix: string = '@'
): LayerSliceInfo | null {
  if (!importPath.startsWith(aliasPrefix)) return null;

  const withoutPrefix = importPath.substring(aliasPrefix.length);
  const parts = withoutPrefix.split('/');

  if (parts.length < 2) return null;

  return {
    layer: parts[0],
    slice: parts[1],
    fullPath: parts[0] + '/' + parts[1],
  };
}
