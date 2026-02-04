/// <reference types="cypress" />

import { captureFullDOM } from './domCapture';
import { SnapshotPluginConfig } from '../plugin/types';

declare global {
  namespace Cypress {
    interface Chainable {
      captureSnapshot(label?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('captureSnapshot', (label?: string) => {
  const env = Cypress.config('env') as any;
  const config: SnapshotPluginConfig = env?.domSnapshotConfig || {};

  const snapshot = captureFullDOM({
    includeComputedStyles: config.includeStyles !== false,
    includePseudoElements: config.includePseudoElements,
    propertiesToInclude: config.cssPropertiesToInclude
  });

  const test = (cy as any).state('test');
  const testInfo = {
    title: test.title,
    titlePath: test.titlePath(),
    file: Cypress.spec.relative,
    duration: 0,
    state: label || 'manual'
  };

  return cy.task(
    'domSnapshot:capture',
    {
      snapshot,
      testInfo,
      cypressVersion: Cypress.version,
      browserInfo: {
        name: Cypress.browser.name,
        version: Cypress.browser.version
      }
    },
    { log: false }
  );
});

beforeEach(function () {
  (cy as any).state('currentTest', this.currentTest);
});

afterEach(function () {
  const env = Cypress.config('env') as any;
  const config: SnapshotPluginConfig = env?.domSnapshotConfig || {};

  if (!this.currentTest) return;

  const shouldCapture =
    (this.currentTest.state === 'failed' && config.captureOnFailure !== false) ||
    (this.currentTest.state === 'passed' && config.captureOnSuccess === true);

  if (!shouldCapture) return;

  const snapshot = captureFullDOM({
    includeComputedStyles: config.includeStyles !== false,
    includePseudoElements: config.includePseudoElements,
    propertiesToInclude: config.cssPropertiesToInclude
  });

  const testInfo = {
    title: this.currentTest.title || 'unknown',
    titlePath: this.currentTest.titlePath?.() || [],
    file: Cypress.spec.relative,
    duration: this.currentTest.duration || 0,
    state: this.currentTest.state || 'unknown',
    error: this.currentTest.err
      ? {
          message: this.currentTest.err.message || '',
          stack: this.currentTest.err.stack,
          name: this.currentTest.err.name || 'Error'
        }
      : undefined
  };

  cy.task(
    'domSnapshot:capture',
    {
      snapshot,
      testInfo,
      cypressVersion: Cypress.version,
      browserInfo: {
        name: Cypress.browser.name,
        version: Cypress.browser.version
      }
    },
    { log: false }
  );
});
