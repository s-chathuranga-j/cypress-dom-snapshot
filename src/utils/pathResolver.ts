import * as path from 'path';

export class PathResolver {
  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  static ensureUnixStyle(filePath: string): string {
    return filePath.split(path.sep).join('/');
  }

  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  static relative(from: string, to: string): string {
    return this.ensureUnixStyle(path.relative(from, to));
  }

  static resolveSnapshotPath(
    projectRoot: string,
    snapshotDir: string,
    specFile: string
  ): string {
    const normalized = this.normalize(snapshotDir);
    const absolute = this.isAbsolute(normalized)
      ? normalized
      : path.join(projectRoot, normalized);

    return path.join(absolute, this.sanitizeSpecName(specFile));
  }

  private static sanitizeSpecName(specFile: string): string {
    const name = path.basename(specFile, path.extname(specFile));
    return name.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
}
