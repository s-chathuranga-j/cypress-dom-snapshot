# Cypress DOM Snapshot Example

This directory contains example tests demonstrating the `cypress-dom-snapshot` plugin.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install test app dependencies:**
   ```bash
   cd test-app
   npm install
   cd ..
   ```

## Running the Localhost Test

The localhost test demonstrates that the plugin works correctly with local development servers.

### Step 1: Start the Test App

In one terminal, start the local test server:

```bash
cd test-app
npm start
```

This will start a simple HTML page at `http://localhost:3000`.

### Step 2: Open the Page in Chrome

Open Chrome and navigate to:
```
http://localhost:3000
```

You should see a purple gradient page with a test form containing:
- Username field
- Email field
- Password field
- Comments textarea
- Terms checkbox
- Submit button
- Feature list

### Step 3: Run Cypress Tests

In another terminal, run the Cypress tests:

```bash
# Run tests in headless mode
npm test

# Or run specific localhost test
npx cypress run --spec "cypress/e2e/localhost-demo.cy.ts"

# Or open Cypress UI
npx cypress open
```

### Step 4: Verify Snapshots

After running the tests, check the generated snapshots:

```bash
# View snapshot directory
ls cypress/snapshots/localhost-demo.cy/

# Check a snapshot JSON file to verify element count
cat cypress/snapshots/localhost-demo.cy/Localhost-DOM-Snapshot-Demo/should-capture-full-DOM-from-localhost-page/[timestamp]_initial-page-load.json
```

**Expected Results:**
- ✅ JSON metadata shows `elementCount` > 30 (not 10) - confirms full page capture
- ✅ `viewport.width` and `viewport.height` have real values like 1000x660 (not 0x0)
- ✅ `pageTitle` shows the actual page title from your test app
- ✅ `url` is `http://localhost:3000/` (not the Cypress iframe URL)
- ✅ HTML file contains actual form elements with inline computed styles
- ✅ HTML file size is > 200KB (indicating full capture with styles)

## What the Tests Verify

### `localhost-demo.cy.ts`

1. **Full DOM Capture**: Verifies the plugin captures the complete localhost page
2. **Form Interaction**: Tests snapshot capture before/during/after form filling
3. **Automatic Failure Capture**: Demonstrates auto-snapshot on test failure
4. **Multiple Snapshots**: Shows sequential snapshot capture
5. **Content Verification**: Confirms actual page content (not Cypress iframe) is captured

### Key Features Tested

- ✅ Localhost port difference handling (Cypress runs on different port than app)
- ✅ Full HTML with inline computed styles
- ✅ Form elements and states
- ✅ Dynamic content (success message visibility)
- ✅ Proper viewport dimensions
- ✅ Complete metadata collection

## Cross-Origin Test (Limitations)

The `cross-origin-demo.cy.ts` test demonstrates limitations when testing external websites:

```bash
npx cypress run --spec "cypress/e2e/cross-origin-demo.cy.ts"
```

**Note:** External sites (like `https://www.saucedemo.com`) will show limited capture due to browser security restrictions.

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is occupied:

1. Change the port in `test-app/package.json`:
   ```json
   "start": "npx http-server . -p 3001 -c-1"
   ```

2. Update `cypress.config.ts`:
   ```typescript
   baseUrl: 'http://localhost:3001'
   ```

### Snapshots Show Only 10 Elements

If snapshots still show ~10 elements, the localhost fix didn't work:

1. Verify the plugin is built:
   ```bash
   cd ../..
   npm run build
   ```

2. Reinstall the plugin in the example:
   ```bash
   cd examples/cypress-v10
   npm install
   ```

3. Check the origin detection is working by adding a log in `commands.ts`

### Test App Not Loading

1. Ensure `http-server` is installed in test-app:
   ```bash
   cd test-app
   npm install
   ```

2. Verify the server started on port 3000:
   ```bash
   curl http://localhost:3000
   ```

## Expected Snapshot Structure

```
cypress/snapshots/
  localhost-demo.cy/
    Localhost-DOM-Snapshot-Demo/
      should-capture-full-DOM-from-localhost-page/
        2026-02-04_XX-XX-XX-XXX_initial-page-load.html
        2026-02-04_XX-XX-XX-XXX_initial-page-load.json
        2026-02-04_XX-XX-XX-XXX_form-filled.html
        2026-02-04_XX-XX-XX-XXX_form-filled.json
        2026-02-04_XX-XX-XX-XXX_form-submitted-success.html
        2026-02-04_XX-XX-XX-XXX_form-submitted-success.json
      should-capture-DOM-on-test-failure-(automatic)/
        [timestamp]_should-capture-DOM-on-test-failure-(automatic).html
        [timestamp]_should-capture-DOM-on-test-failure-(automatic).json
      ...
```

## Comparing Localhost vs Cross-Origin Snapshots

After running both test files:

```bash
# Localhost snapshot (should have many elements)
cat cypress/snapshots/localhost-demo.cy/*/should-capture-full-DOM-from-localhost-page/*_initial-page-load.json | grep elementCount

# Cross-origin snapshot (will have few elements)
cat cypress/snapshots/cross-origin-demo.cy/*/should-capture-snapshot-from-cross-origin-page/*_login-page.json | grep elementCount
```

This demonstrates the difference between localhost (full capture) and external sites (limited capture).
