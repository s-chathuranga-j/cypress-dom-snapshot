# Cypress DOM Snapshot

Automatically capture DOM snapshots when Cypress tests fail. Save complete HTML (with inline styles) and JSON metadata for debugging.

## Features

- **Automatic Capture**: Snapshots saved automatically when tests fail
- **Rich HTML Snapshots**: Full DOM with computed styles inlined
- **Detailed Metadata**: JSON files with test info, error details, and page metadata
- **Organized Storage**: Snapshots organized by test hierarchy
- **Manual Capture**: Optional `cy.captureSnapshot()` command
- **Iframe Support**: Captures same-origin iframe content
- **Shadow DOM**: Captures open shadow DOM content
- **TypeScript**: Full TypeScript support with type definitions
- **Cucumber Support**: Safe integration with `@badeball/cypress-cucumber-preprocessor`

## Installation

```bash
npm install cypress-dom-snapshot --save-dev
```

## Quick Start

### 1. Register the Plugin

In your `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';
import { domSnapshotPlugin } from 'cypress-dom-snapshot';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      domSnapshotPlugin(on, config);
    }
  }
});
```

### 2. Import Commands

In your `cypress/support/e2e.ts`:

```typescript
import 'cypress-dom-snapshot/dist/browser/commands';
```

### 3. Run Your Tests

That's it! When tests fail, snapshots will be automatically saved to `cypress/snapshots/`.

## Configuration

Customize the plugin behavior:

```typescript
domSnapshotPlugin(on, config, {
  snapshotDir: 'cypress/snapshots',       // Base directory
  formats: ['html', 'json'],              // Output formats
  captureOnFailure: true,                 // Auto-capture on failure
  captureOnSuccess: false,                // Capture on success too
  includeStyles: true,                    // Inline computed styles
  includePseudoElements: false,           // Capture ::before/::after
  cssPropertiesToInclude: null,           // null = all properties
  captureIframes: true,                   // Capture iframe content
  captureShadowDom: true,                 // Capture shadow DOM
  maxSnapshotSize: 50 * 1024 * 1024,     // 50MB max size
  verbose: true,                          // Enable logging

  // Custom hooks
  beforeSnapshot: async (snapshot) => {
    console.log('Capturing...');
    return snapshot;
  },

  afterSnapshot: async (filePaths) => {
    console.log('Saved:', filePaths);
  }
});
```

## Manual Snapshots

Capture snapshots at any point in your tests:

```typescript
it('should allow manual snapshots', () => {
  cy.visit('/');

  // Capture before action
  cy.captureSnapshot('before-login');

  cy.get('#username').type('user');
  cy.get('#password').type('pass');
  cy.get('#submit').click();

  // Capture after action
  cy.captureSnapshot('after-login');
});
```

## Output Structure

Snapshots are organized by spec file and test hierarchy:

```
cypress/snapshots/
  login-spec/
    describe-authentication/
      describe-successful-login/
        2026-02-04_14-30-25-123_should-login-with-valid-credentials.html
        2026-02-04_14-30-25-123_should-login-with-valid-credentials.json
```

### HTML Snapshot

Complete DOM with all computed styles inlined for accurate visual reproduction:

```html
<!DOCTYPE html>
<html style="display: block; margin: 0px; padding: 0px; ...">
  <head>...</head>
  <body style="margin: 8px; display: block; ...">
    <div style="color: rgb(33, 37, 41); font-size: 16px; ...">
      Content with all styles preserved
    </div>
  </body>
</html>
```

### JSON Metadata

Comprehensive metadata about the test and page state:

```json
{
  "version": "1.0.0",
  "timestamp": 1707054625123,
  "timestampISO": "2026-02-04T14:30:25.123Z",
  "test": {
    "title": "should login with valid credentials",
    "titlePath": ["Authentication", "Successful Login", "should login with valid credentials"],
    "file": "cypress/e2e/login.cy.ts",
    "duration": 1523,
    "state": "failed",
    "error": {
      "message": "Timed out retrying after 4000ms: Expected to find element: `.success-message`, but never found it.",
      "name": "AssertionError"
    }
  },
  "page": {
    "url": "https://example.com/login",
    "title": "Login Page",
    "viewport": { "width": 1280, "height": 720 },
    "scrollPosition": { "x": 0, "y": 150 },
    "userAgent": "Mozilla/5.0..."
  },
  "dom": {
    "elementCount": 247,
    "iframeCount": 0,
    "shadowDomCount": 1,
    "hasExternalStyles": true,
    "externalStylesheets": ["https://example.com/styles.css"]
  },
  "cypress": {
    "version": "13.6.3",
    "browser": { "name": "chrome", "version": "120.0.0.0" }
  },
  "snapshot": {
    "htmlFile": "2026-02-04_14-30-25-123_should-login-with-valid-credentials.html",
    "htmlSize": 245678
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `snapshotDir` | `string` | `'cypress/snapshots'` | Base directory for snapshots |
| `formats` | `('html'\|'json')[]` | `['html', 'json']` | Output formats |
| `captureOnFailure` | `boolean` | `true` | Auto-capture on test failure |
| `captureOnSuccess` | `boolean` | `false` | Capture on success too |
| `includeStyles` | `boolean` | `true` | Inline computed styles |
| `includePseudoElements` | `boolean` | `false` | Capture `::before`/`::after` |
| `cssPropertiesToInclude` | `string[]\|null` | `null` | Specific CSS properties (null = all) |
| `captureIframes` | `boolean` | `true` | Capture iframe content |
| `captureShadowDom` | `boolean` | `true` | Capture shadow DOM |
| `maxSnapshotSize` | `number` | `52428800` | Max file size (50MB) |
| `verbose` | `boolean` | `true` | Enable logging |
| `fileNameGenerator` | `function` | Built-in | Custom file naming |
| `beforeSnapshot` | `function` | - | Pre-save hook |
| `afterSnapshot` | `function` | - | Post-save hook |
| `skipHooks` | `boolean` | `false` | Skip automatic hook registration |

## Advanced Usage

### Custom File Naming

```typescript
domSnapshotPlugin(on, config, {
  fileNameGenerator: (options) => {
    const { testTitle, timestamp } = options;
    return `${testTitle}-${timestamp}.html`;
  }
});
```

### Snapshot Modification

```typescript
domSnapshotPlugin(on, config, {
  beforeSnapshot: async (snapshot) => {
    // Redact sensitive data
    snapshot.html = snapshot.html.replace(/\d{16}/g, '****-****-****-****');
    return snapshot;
  }
});
```

### Integration with Reporting

```typescript
domSnapshotPlugin(on, config, {
  afterSnapshot: async (filePaths) => {
    // Upload to S3, attach to test report, etc.
    await uploadToS3(filePaths);
  }
});
```

### Using with Cucumber Preprocessor (@badeball)

If you also use `@badeball/cypress-cucumber-preprocessor`, you may have seen event-handler conflicts in other plugins. This plugin avoids conflicts by default:

- By default, no `after:spec` handler is registered unless you provide an `afterSnapshot` hook.
- You can force-disable all automatic hook registrations using `skipHooks: true`.
- You can call our `handleAfterSpec()` manually from your own `after:spec` handler.

Option A — Let this plugin auto-register `after:spec` only when needed:

```ts
import { defineConfig } from 'cypress';
import { domSnapshotPlugin } from 'cypress-dom-snapshot';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      domSnapshotPlugin(on, config, {
        afterSnapshot: async (files) => {/* do something */}
      });
    }
  }
});
```

Option B — If you already manage `after:spec` (for example, via Cucumber), disable hooks and call our handler manually:

```ts
import { defineConfig } from 'cypress';
import { domSnapshotPlugin, handleAfterSpec } from 'cypress-dom-snapshot';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Do not register our internal hooks automatically
      domSnapshotPlugin(on, config, {
        skipHooks: true,
        afterSnapshot: async (files) => {/* do something */}
      });

      on('after:spec', async (spec, results) => {
        // Delegate to the plugin's manual handler
        await handleAfterSpec(spec, results, config, {
          // repeat only the options you need here (optional)
          afterSnapshot: async (files) => {/* do something */}
        });
      });
    }
  }
});
```

Tip: If you prefer, you can also use the community `cypress-on-fix` wrapper to multiplex event handlers from multiple plugins.

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import { SnapshotPluginConfig } from 'cypress-dom-snapshot';

const config: SnapshotPluginConfig = {
  snapshotDir: 'snapshots',
  formats: ['html']
};

domSnapshotPlugin(on, cypressConfig, config);
```

## How It Works

1. **Test Failure**: When a Cypress test fails
2. **Browser Capture**: `afterEach` hook runs in browser context
3. **DOM Serialization**: Captures DOM with `window.getComputedStyle()`
4. **Style Inlining**: All computed styles inlined into elements
5. **Data Transfer**: Serialized data sent to Node process via `cy.task()`
6. **File Writing**: Node process writes HTML and JSON files
7. **Organization**: Files organized by test hierarchy

## Works with ANY Site via cy.visit()

The plugin works seamlessly with **all sites visited via `cy.visit()`** - including localhost, staging, and production sites:

- ✅ Full HTML with inline styles
- ✅ Same-origin iframes
- ✅ Shadow DOM (open mode)
- ✅ Complete metadata (viewport, scroll position, etc.)

### Localhost Development
The plugin intelligently treats `localhost` and `127.0.0.1` with different ports as same-origin. Even if Cypress runs on `localhost:64874` and your app runs on `localhost:3000`, full DOM capture works perfectly.

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Your local app
  }
});

// Your test
it('should capture localhost page', () => {
  cy.visit('/');
  cy.get('#username').type('testuser');

  // Full DOM capture with all features
  cy.captureSnapshot('localhost-page');
});
```

### External Sites
**Great news!** The plugin also works with external websites when visited via `cy.visit()`:

```typescript
it('should capture external site', () => {
  cy.visit('https://www.saucedemo.com');
  cy.get('#user-name').type('standard_user');

  // Full DOM capture works! ✅
  cy.captureSnapshot('login-page');
});
```

**Why it works:** When you use `cy.visit(url)`, Cypress changes its spec iframe origin to match the visited site. This gives the plugin full DOM access without any browser security restrictions.

**Full DOM capture works for:**
- ✅ `http://localhost:3000` - localhost (any port)
- ✅ `http://127.0.0.1:5173` - local IP (any port)
- ✅ `https://www.saucedemo.com` - external sites via `cy.visit()`
- ✅ `https://example.com` - any site visited via `cy.visit()`
- ✅ **No `chromeWebSecurity: false` needed!**

## Multi-Origin Testing Limitations

The **only limitation** is when testing across MULTIPLE origins in ONE test using `cy.origin()`:

```typescript
it('multi-origin test', () => {
  cy.visit('https://app.com');
  cy.captureSnapshot('app'); // ✅ Works perfectly

  // Switch to a different origin in the same test
  cy.origin('https://api.com', () => {
    cy.visit('/');
    cy.captureSnapshot('api'); // ⚠️ Limited - captures spec bridge only
  });
});
```

For 99% of tests (single origin per test), full DOM capture works perfectly.

## Limitations

- **Shadow DOM**: Only open shadow roots accessible
- **File Size**: Very large DOMs may exceed `maxSnapshotSize`
- **Dynamic Content**: Snapshots are point-in-time captures
- **Cross-Origin Iframes**: Iframes with different origins than the parent page cannot be captured (browser security)

## Troubleshooting

### Snapshots Not Created

Check that:
- Plugin is registered in `cypress.config.ts`
- Commands are imported in `cypress/support/e2e.ts`
- Tests are actually failing
- `captureOnFailure` is `true` (default)

### Large File Sizes

Reduce size by:
- Setting `cssPropertiesToInclude` to specific properties
- Disabling `includePseudoElements`
- Adjusting `maxSnapshotSize`

### Testing External Sites

Full DOM capture works for any site visited via `cy.visit()`, including external sites like `https://www.saucedemo.com`. No special configuration needed - just visit the site normally and snapshots will capture the complete DOM.

### Multi-Origin Testing

If you're using `cy.origin()` to test across multiple origins in a single test, note that snapshots inside `cy.origin()` callbacks will capture limited data (Cypress spec bridge only). For full DOM capture, keep tests to a single origin per test file.

## Examples

See the `examples/cypress-v10` directory for a complete working example.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
