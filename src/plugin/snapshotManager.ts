import * as fs from 'fs-extra';
import * as path from 'path';
import { SnapshotPluginConfig, DOMSnapshot, TestInfo, SnapshotMetadata } from './types';
import {
  generateSnapshotFileName,
  generateSnapshotDirectory,
  FileNamingOptions
} from '../utils/fileNaming';

export class SnapshotManager {
  constructor(
    private baseDir: string,
    private config: SnapshotPluginConfig
  ) {}

  async saveSnapshot(
    snapshot: DOMSnapshot,
    testInfo: TestInfo,
    metadata: SnapshotMetadata
  ): Promise<string[]> {
    const filePaths: string[] = [];

    const snapshotDir = generateSnapshotDirectory(this.baseDir, testInfo.file);

    await fs.ensureDir(snapshotDir);

    const fileNamingOptions: FileNamingOptions = {
      testTitle: testInfo.title,
      testTitlePath: testInfo.titlePath,
      specFile: testInfo.file,
      timestamp: snapshot.timestamp
    };

    const fileNameFn = this.config.fileNameGenerator || generateSnapshotFileName;

    if (this.config.formats?.includes('html')) {
      const htmlFileName = fileNameFn(fileNamingOptions, 'html');
      const htmlPath = path.join(snapshotDir, htmlFileName);

      if (this.config.maxSnapshotSize) {
        const size = Buffer.byteLength(snapshot.html, 'utf8');
        if (size > this.config.maxSnapshotSize) {
          console.warn(
            `[DOM Snapshot] HTML snapshot exceeds max size (${size} bytes), skipping`
          );
        } else {
          await fs.ensureDir(path.dirname(htmlPath));
          await fs.writeFile(htmlPath, snapshot.html, 'utf8');
          filePaths.push(htmlPath);
        }
      } else {
        await fs.ensureDir(path.dirname(htmlPath));
        await fs.writeFile(htmlPath, snapshot.html, 'utf8');
        filePaths.push(htmlPath);
      }
    }

    if (this.config.formats?.includes('json')) {
      const jsonFileName = fileNameFn(fileNamingOptions, 'json');
      const jsonPath = path.join(snapshotDir, jsonFileName);

      const updatedMetadata = { ...metadata };
      if (filePaths[0]) {
        const stats = await fs.stat(filePaths[0]);
        updatedMetadata.snapshot = {
          htmlFile: path.basename(filePaths[0]),
          htmlSize: stats.size
        };
      }

      await fs.ensureDir(path.dirname(jsonPath));
      await fs.writeFile(jsonPath, JSON.stringify(updatedMetadata, null, 2), 'utf8');
      filePaths.push(jsonPath);
    }

    return filePaths;
  }

  async getSnapshotFilesForSpec(specPath: string): Promise<string[]> {
    const snapshotDir = generateSnapshotDirectory(this.baseDir, specPath);

    if (!(await fs.pathExists(snapshotDir))) {
      return [];
    }

    const getAllFiles = async (dir: string): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(entry => {
          const fullPath = path.join(dir, entry.name);
          return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
        })
      );
      return files.flat();
    };

    return getAllFiles(snapshotDir);
  }
}
