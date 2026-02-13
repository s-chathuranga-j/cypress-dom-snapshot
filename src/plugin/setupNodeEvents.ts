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
  
  // Only register after:spec if afterSnapshot hook is provided and skipHooks is false.
  // This avoids conflicts with other plugins that also use after:spec (like cucumber-preprocessor)
  if (pluginConfig.afterSnapshot && !pluginConfig.skipHooks) {
    on('after:spec', async (spec, results) => {
      if (!results) return;

      const snapshotFiles = await manager.getSnapshotFilesForSpec(spec.relative);
      await pluginConfig.afterSnapshot!(snapshotFiles);
    });
  }

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

/**
 * Manual handler for after:spec event.
 * Use this if you have conflicts with other plugins and want to call the logic manually.
 */
export async function handleAfterSpec(
  spec: Cypress.Spec,
  results: any,
  config: Cypress.PluginConfigOptions,
  userConfig: SnapshotPluginConfig = {}
): Promise<void> {
  const pluginConfig = { ...DEFAULT_CONFIG, ...userConfig };
  
  if (pluginConfig.afterSnapshot) {
    const snapshotDir = path.resolve(config.projectRoot, pluginConfig.snapshotDir);
    const manager = new SnapshotManager(snapshotDir, pluginConfig);
    const snapshotFiles = await manager.getSnapshotFilesForSpec(spec.relative);
    await pluginConfig.afterSnapshot(snapshotFiles);
  }
}
