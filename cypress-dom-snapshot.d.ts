/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Manually capture a DOM snapshot
     * @example cy.captureSnapshot('manual-checkpoint')
     */
    captureSnapshot(label?: string): Chainable<void>;
  }

  interface Cypress {
    domSnapshot: {
      config: import('./src/plugin/types').SnapshotPluginConfig;
    };
  }
}

declare module 'cypress-dom-snapshot' {
  export function domSnapshotPlugin(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    userConfig?: import('./src/plugin/types').SnapshotPluginConfig
  ): void;

  export * from './src/plugin/types';
}
