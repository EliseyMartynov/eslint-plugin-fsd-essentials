import { normalizePath } from './path-utils';

/**
 * Получает корневую директорию слайса
 */
export function getSliceRoot(filePath: string, srcPath: string): string | null {
  const normalized = normalizePath(filePath);
  const normalizedSrcPath = normalizePath(srcPath);
  const srcIndex = normalized.indexOf(normalizedSrcPath);

  if (srcIndex === -1) return null;

  const afterSrc = normalized.substring(srcIndex + normalizedSrcPath.length);
  const parts = afterSrc.split('/');

  if (parts.length < 2) return null;

  const sliceDepth = srcIndex + normalizedSrcPath.length + parts[0].length + 1 + parts[1].length;
  return normalized.substring(0, sliceDepth);
}
