/// <reference types="cypress" />

import { captureFullDOM } from './domCapture';
import { SnapshotPluginConfig } from '../plugin/types';
import { captureAUTDocument } from './crossOriginCapture';

declare global {
  namespace Cypress {
    interface Chainable {
      captureSnapshot(label?: string): Chainable<void>;
    }
  }
}

function getActualOrigin(): string {
  // In Cypress, we need to get the AUT origin, not the spec iframe origin
  try {
    // Try to get the origin from Cypress's internal state
    const autWindow = (cy as any).state('window');
    if (autWindow && autWindow.location) {
      return autWindow.location.origin;
    }
  } catch {
    // Fallback to current window
  }
  return window.location.origin;
}

function isCrossOrigin(): boolean {
  try {
    const specOrigin = window.location.origin;
    const autOrigin = getActualOrigin();

    // Parse URLs to check hostnames
    const specUrl = new URL(specOrigin);
    const autUrl = new URL(autOrigin);

    // If both are localhost/127.0.0.1, treat as same-origin
    // regardless of port differences (common in local development)
    const isLocalhostSpec = specUrl.hostname === 'localhost' || specUrl.hostname === '127.0.0.1';
    const isLocalhostAut = autUrl.hostname === 'localhost' || autUrl.hostname === '127.0.0.1';

    if (isLocalhostSpec && isLocalhostAut) {
      return false; // Same-origin for localhost, even with different ports
    }

    // For non-localhost, check full origin match (protocol + hostname + port)
    return specOrigin !== autOrigin;
  } catch {
    return false;
  }
}

Cypress.Commands.add('captureSnapshot', (label?: string) => {
  const env = Cypress.config('env') as any;
  const config: SnapshotPluginConfig = env?.domSnapshotConfig || {};

  const test = (cy as any).state('test');
  const testInfo = {
    title: test.title,
    titlePath: test.titlePath(),
    file: Cypress.spec.relative,
    duration: 0,
    state: label || 'manual'
  };

  const browserInfo = {
    name: Cypress.browser.name,
    version: Cypress.browser.version
  };

  const serializationOptions = {
    includeComputedStyles: config.includeStyles !== false,
    includePseudoElements: config.includePseudoElements,
    propertiesToInclude: config.cssPropertiesToInclude
  };

  // Check if we're dealing with a cross-origin page
  if (isCrossOrigin()) {
    // Use cy.origin for cross-origin capture
    const autOrigin = getActualOrigin();

    return cy.origin(
      autOrigin,
      { args: { serializationOptions, testInfo, browserInfo, cypressVersion: Cypress.version } },
      ({ serializationOptions, testInfo, browserInfo, cypressVersion }) => {
        // Use cy.document() and cy.window() to get actual AUT document/window
        cy.document().then((doc) => {
          cy.window().then((win) => {
            // Inline capture logic since Cypress.require doesn't work reliably
            // This is a simplified capture that gets the essential DOM
            const timestamp = Date.now();
            const url = win.location.href;

            // Simple HTML capture with basic style inlining
            const clone = doc.documentElement.cloneNode(true) as HTMLElement;
            const walker = doc.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
            const originalWalker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ELEMENT);

            let cloneNode: Node | null;
            let originalNode: Node | null;

            while ((cloneNode = walker.nextNode()) && (originalNode = originalWalker.nextNode())) {
              if (cloneNode.nodeType === Node.ELEMENT_NODE) {
                const cloneEl = cloneNode as HTMLElement;
                const originalEl = originalNode as HTMLElement;
                const computed = win.getComputedStyle(originalEl);
                const inlineStyle: string[] = [];

                Array.from(computed).forEach(prop => {
                  const value = computed.getPropertyValue(prop);
                  if (value) {
                    inlineStyle.push(`${prop}: ${value}`);
                  }
                });

                if (inlineStyle.length > 0) {
                  cloneEl.setAttribute('style', inlineStyle.join('; '));
                }
              }
            }

            const html = clone.outerHTML;
            const elementCount = doc.querySelectorAll('*').length;

            const snapshot = {
              timestamp,
              url,
              html,
              iframes: [],
              shadowDoms: [],
              metadata: {
                pageTitle: doc.title,
                viewport: {
                  width: win.innerWidth,
                  height: win.innerHeight
                },
                scrollPosition: {
                  x: win.scrollX,
                  y: win.scrollY
                },
                externalStylesheets: Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
                  .map(link => (link as HTMLLinkElement).href)
              }
            };

            cy.task(
              'domSnapshot:capture',
              {
                snapshot,
                testInfo,
                cypressVersion,
                browserInfo
              },
              { log: false }
            );
          });
        });
      }
    );
  } else {
    // Same-origin capture - use cy.window() and cy.document() to get AUT
    return cy.window().then((win: Window) => {
      return cy.document().then((doc: Document) => {
        const snapshot = captureFullDOM(serializationOptions, doc, win);

        return cy.task(
          'domSnapshot:capture',
          {
            snapshot,
            testInfo,
            cypressVersion: Cypress.version,
            browserInfo
          },
          { log: false }
        );
      });
    });
  }
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

  const browserInfo = {
    name: Cypress.browser.name,
    version: Cypress.browser.version
  };

  const serializationOptions = {
    includeComputedStyles: config.includeStyles !== false,
    includePseudoElements: config.includePseudoElements,
    propertiesToInclude: config.cssPropertiesToInclude
  };

  // Check if we're dealing with a cross-origin page
  if (isCrossOrigin()) {
    // Use cy.origin for cross-origin capture
    const autOrigin = getActualOrigin();

    cy.origin(
      autOrigin,
      { args: { serializationOptions, testInfo, browserInfo, cypressVersion: Cypress.version } },
      ({ serializationOptions, testInfo, browserInfo, cypressVersion }) => {
        // Use cy.document() and cy.window() to get actual AUT document/window
        cy.document().then((doc) => {
          cy.window().then((win) => {
            // Inline capture logic
            const timestamp = Date.now();
            const url = win.location.href;

            const clone = doc.documentElement.cloneNode(true) as HTMLElement;
            const walker = doc.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
            const originalWalker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ELEMENT);

            let cloneNode: Node | null;
            let originalNode: Node | null;

            while ((cloneNode = walker.nextNode()) && (originalNode = originalWalker.nextNode())) {
              if (cloneNode.nodeType === Node.ELEMENT_NODE) {
                const cloneEl = cloneNode as HTMLElement;
                const originalEl = originalNode as HTMLElement;
                const computed = win.getComputedStyle(originalEl);
                const inlineStyle: string[] = [];

                Array.from(computed).forEach(prop => {
                  const value = computed.getPropertyValue(prop);
                  if (value) {
                    inlineStyle.push(`${prop}: ${value}`);
                  }
                });

                if (inlineStyle.length > 0) {
                  cloneEl.setAttribute('style', inlineStyle.join('; '));
                }
              }
            }

            const html = clone.outerHTML;

            const snapshot = {
              timestamp,
              url,
              html,
              iframes: [],
              shadowDoms: [],
              metadata: {
                pageTitle: doc.title,
                viewport: {
                  width: win.innerWidth,
                  height: win.innerHeight
                },
                scrollPosition: {
                  x: win.scrollX,
                  y: win.scrollY
                },
                externalStylesheets: Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
                  .map(link => (link as HTMLLinkElement).href)
              }
            };

            cy.task(
              'domSnapshot:capture',
              {
                snapshot,
                testInfo,
                cypressVersion,
                browserInfo
              },
              { log: false }
            );
          });
        });
      }
    );
  } else {
    // Same-origin capture - use cy.window() and cy.document() to get AUT
    cy.window().then((win: Window) => {
      cy.document().then((doc: Document) => {
        const snapshot = captureFullDOM(serializationOptions, doc, win);

        cy.task(
          'domSnapshot:capture',
          {
            snapshot,
            testInfo,
            cypressVersion: Cypress.version,
            browserInfo
          },
          { log: false }
        );
      });
    });
  }
});
