import * as path from 'path';
import { FileNamingOptions } from '../plugin/types';

export { FileNamingOptions };

export function generateSnapshotFileName(
  options: FileNamingOptions,
  format: 'html' | 'json'
): string {
  const { testTitle, testTitlePath, timestamp, index = 0 } = options;

  const sanitizedPath = testTitlePath
    .map(part => sanitizeForFilename(part))
    .join(path.sep);

  const timestampStr = formatTimestamp(timestamp);

  const sanitizedTitle = sanitizeForFilename(testTitle);

  let fileName = `${timestampStr}_${sanitizedTitle}`;
  if (index > 0) {
    fileName += `_${index}`;
  }
  fileName += `.${format}`;

  return path.join(sanitizedPath, fileName);
}

export function generateSnapshotDirectory(
  baseDir: string,
  specRelativePath: string
): string {
  const specName = path.basename(specRelativePath, path.extname(specRelativePath));
  return path.join(baseDir, sanitizeForFilename(specName));
}

export function sanitizeForFilename(str: string): string {
  return str
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${ms}`;
}
