import * as path from 'path';
import { SnapshotPluginConfig, DEFAULT_CONFIG, DOMSnapshot, TestInfo } from './types';
import { SnapshotManager } from './snapshotManager';
import { generateMetadata } from '../browser/jsonSerializer';

export function setupSnapshotPlugin(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
  userConfig: SnapshotPluginConfig = {}
): void {
  const pluginConfig = { ...DEFAULT_CONFIG, ...userConfig };

  const snapshotDir = path.resolve(config.projectRoot, pluginConfig.snapshotDir);

  const manager = new SnapshotManager(snapshotDir, pluginConfig);

  on('after:spec', async (spec, results) => {
    if (!results) return;

    const failedTests =
      results.tests?.filter(test => {
        return test.attempts.some(attempt => attempt.state === 'failed');
      }) || [];

    if (pluginConfig.verbose && failedTests.length > 0) {
      console.log(
        `[DOM Snapshot] Found ${failedTests.length} failed test(s) in ${spec.relative}`
      );
    }

    if (pluginConfig.afterSnapshot) {
      const snapshotFiles = await manager.getSnapshotFilesForSpec(spec.relative);
      await pluginConfig.afterSnapshot(snapshotFiles);
    }
  });

  on('task', {
    'domSnapshot:capture': async (data: {
      snapshot: DOMSnapshot;
      testInfo: TestInfo;
      cypressVersion: string;
      browserInfo: { name: string; version: string };
    }) => {
      try {
        const { snapshot, testInfo, cypressVersion, browserInfo } = data;

        let processedSnapshot = snapshot;
        if (pluginConfig.beforeSnapshot) {
          processedSnapshot = await pluginConfig.beforeSnapshot(snapshot);
        }

        const metadata = generateMetadata(
          processedSnapshot,
          testInfo,
          cypressVersion,
          browserInfo
        );

        const filePaths = await manager.saveSnapshot(
          processedSnapshot,
          testInfo,
          metadata
        );

        if (pluginConfig.verbose) {
          console.log(`[DOM Snapshot] Saved snapshot for "${testInfo.title}"`);
          filePaths.forEach(p => console.log(`  - ${p}`));
        }

        return { success: true, files: filePaths };
      } catch (error) {
        console.error('[DOM Snapshot] Error saving snapshot:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  });

  config.env = config.env || {};
  config.env.domSnapshotConfig = pluginConfig;
}
