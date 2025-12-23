import { isSameSlice } from './layer-detector';

/**
 * Проверяет, является ли импорт через Public API
 */
export function isPublicApiImport(
  importPath: string,
  currentFilePath: string,
  importedLayer: string | null,
  aliasPrefix: string,
  aliasMap: Record<string, string>,
  srcPath: string
): boolean {
  const isSameSliceImport = isSameSlice(importPath, currentFilePath, srcPath);
  if (isSameSliceImport) {
    return true;
  }

  if (importPath.startsWith(aliasPrefix)) {
    const isKnownAlias = Object.keys(aliasMap).some((alias) => importPath.startsWith(alias + '/'));

    if (isKnownAlias) {
      const withoutPrefix = importPath.substring(aliasPrefix.length);
      const match = withoutPrefix.match(/^\w+\/(.+)$/);

      if (match) {
        const pathAfterAlias = match[1];
        const pathParts = pathAfterAlias.split('/');

        if (pathParts.length > 1 && pathParts[pathParts.length - 1] !== 'index') {
          return false;
        }
      }
    }
  }

  return true;
}
