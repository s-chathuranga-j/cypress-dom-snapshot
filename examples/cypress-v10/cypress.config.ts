import { defineConfig } from 'cypress';
import { domSnapshotPlugin } from 'cypress-dom-snapshot';

export default defineConfig({
  e2e: {
    baseUrl: 'http://www.saucedemo.com',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    experimentalOriginDependencies: true,

    setupNodeEvents(on, config) {
      domSnapshotPlugin(on, config, {
        snapshotDir: 'cypress/snapshots',
        formats: ['html', 'json'],
        captureOnFailure: true,
        captureOnSuccess: false,
        includeStyles: true,
        captureIframes: true,
        captureShadowDom: true,
        verbose: true,

        beforeSnapshot: async snapshot => {
          console.log('[Example] Capturing snapshot...');
          return snapshot;
        },

        afterSnapshot: async filePaths => {
          console.log('[Example] Snapshot saved:', filePaths);
        }
      });
    }
  }
});
