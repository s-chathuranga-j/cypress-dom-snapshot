import { SnapshotPluginConfig } from './plugin/types';
import { setupSnapshotPlugin } from './plugin/setupNodeEvents';

export function domSnapshotPlugin(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
  userConfig?: SnapshotPluginConfig
): void {
  return setupSnapshotPlugin(on, config, userConfig);
}

export * from './plugin/types';

module.exports = domSnapshotPlugin;
module.exports.domSnapshotPlugin = domSnapshotPlugin;
