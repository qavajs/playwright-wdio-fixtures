# @qavajs/playwright-wdio-fixtures

A Playwright test fixture that enables using [WebdriverIO](https://webdriver.io/) browser and element APIs within Playwright tests, with extended Jest-style matchers for WebdriverIO elements.

## Motivation

Introducing WebdriverIO fixtures for the Playwright test runner enables teams to combine Playwright’s powerful orchestration with WebdriverIO’s broad automation capabilities.

The Playwright test runner provides an advanced foundation for modern testing:
- A fixture-based architecture that ensures clear test setup and teardown.
- Parallelization and sharding out of the box for high performance.
- Rich reporting and debugging tools such as trace viewer, HTML reports, and step-by-step execution insights.

On top of this, adding WebdriverIO fixtures brings unique advantages:
- Real Cross-Browser Testing

WebdriverIO connects directly to native browser builds through the WebDriver protocol, including Chrome, Edge, Safari, and Firefox.

This ensures tests can be executed in the exact environments used by end users, providing full cross-browser coverage.

- Appium & Mobile Automation

With WebdriverIO’s mature Appium integration, the same test runner can be extended to cover iOS and Android apps, both native and hybrid.

This makes it possible to unify web and mobile automation under a single testing strategy.

- Unified Automation Ecosystem

Leveraging WebdriverIO fixtures brings in a rich ecosystem of integrations such as Appium, BrowserStack, and Sauce Labs.

Teams can scale their testing approach seamlessly—from fast local checks to full compatibility testing in cloud and mobile environments.

In short:
Motivation = Playwright test runner + WebdriverIO fixtures =

- Powerful orchestration with advanced reporting
- Real cross-browser validation
- Mobile automation with Appium
- Unified and scalable automation framework

## Features

- Use WebdriverIO's browser and element APIs in Playwright test files.
- Rich set of Jest-style matchers for WebdriverIO elements (`toExist`, `toBeVisible`, `toHaveText`, etc.).
- Step logging and integration with Playwright's test runner and reporting.
- TypeScript support

## Installation

```sh
npm install @qavajs/playwright-wdio-fixtures
```

You also need `@playwright/test` and `webdriverio` as peer dependencies.

## Usage

1. **Configure Playwright**

In your `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
import { WdioOptions } from '@qavajs/playwright-wdio-fixtures';

export default defineConfig<WdioOptions>({
  testDir: './tests',
  projects: [
    {
      name: 'wdio',
      use: {
        wdioLaunchOptions: {
          logLevel: 'error',
          capabilities: {
            browserName: 'chrome',
          },
        }
      }
    },
  ],
});
```

2. **Write Tests**

In your test files, import `test` and `expect` from the module:

```ts
import { test, expect } from '@qavajs/playwright-wdio-fixtures';

test.beforeEach(async ({ wdioBrowser }) => {
  await wdioBrowser.url('https://www.saucedemo.com/');
});

test('login button should be enabled', async ({ $ }) => {
  await expect($('#login-button')).toBeEnabled();
});
```

### Fixtures

- `wdioBrowser`: WebdriverIO `Browser` instance.
- `$`, `$$`: Element query functions, bound to the browser.

### Matchers

You can use extended matchers on WebdriverIO elements, such as:

- `toExist`
- `toBeVisible`
- `toBeEnabled` / `toBeDisabled`
- `toBeFocused`
- `toHaveText`
- `toHaveValue`
- `toHaveAttribute`
- `toHaveElementClass`
- `toHaveId`
- `toHaveProperty`
- `toHaveUrl`
- `toHaveTitle`
- ...and more

See [`tests/expect.spec.ts`](tests/expect.spec.ts) for examples.

## Example

```ts
import { test, expect } from '@qavajs/playwright-wdio-fixtures';

test('should login successfully', async ({ $ }) => {
  await $('#user-name').setValue('standard_user');
  await $('#password').setValue('secret_sauce');
  await $('#login-button').click();
  await expect($('#user-name')).toBeHidden();
});
```

## Scripts

- `npm run build` — Compile TypeScript to `lib/`
- `npm test` — Run Playwright tests
- `npm run debug` — Run Playwright UI mode

## License

MIT

---

**See also:**  
- [WebdriverIO Docs](https://webdriver.io/docs/api.html)  
- [Playwright Test Docs](https://playwright.dev/docs/test-intro)