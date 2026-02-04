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

## Limitations

- **Iframes**: Only same-origin iframes can be captured (browser security)
- **Shadow DOM**: Only open shadow roots accessible
- **File Size**: Very large DOMs may exceed `maxSnapshotSize`
- **Dynamic Content**: Snapshots are point-in-time captures

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

### Cross-Origin Iframes

Cross-origin iframes cannot be captured due to browser security. The snapshot will include metadata about the iframe but not its content.

## Examples

See the `examples/cypress-v10` directory for a complete working example.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
