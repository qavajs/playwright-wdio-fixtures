# Change Log

All notable changes to the "@qavajs/playwright-wdio-fixtures" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature

:beetle: - bugfix

:x: - deprecation/removal

:pencil: - chore

:microscope: - experimental

## [Unreleased]
- :pencil: introduced `StringAsymentric` type alias (`string | ReturnType<typeof expect.stringContaining>`) and applied it to `toHaveValue`, `toHaveHref`, `toHaveLink`, `toHaveId`, `toHaveText`, `toHaveHTML`, and `toHaveElementProperty` for better type safety with asymmetric matchers
- :beetle: fixed `toBeElementsArrayOfSize` receiving `ChainablePromiseElement[]` instead of `ChainablePromiseArray`, aligning the type with WebdriverIO's actual `$$` return value

## [1.2.0]
- :rocket: improved step title logging in `createWdioDriverProxy`:
  - `printableArgs` now renders small arrays inline (e.g. `["foo", "bar"]`) and compact JSON for small objects instead of the generic `array` / `object` tokens
  - added `printableSelector` helper that safely serialises complex or object-typed element selectors
  - WebdriverIO commands are now invoked *inside* the `ctx.step` callback so Playwright trace timing accurately covers the full command execution

## [1.1.0]
- :beetle: fixed `toHaveElementClass` incorrectly wrapping array input in a second array, causing multi-class assertions to always fail
- :beetle: fixed `toHaveSize` returning a string token instead of actual pixel dimensions, making failure messages uninformative
- :rocket: `toHaveComputedLabel` and `toHaveComputedRole` now delegate to WebdriverIO's native `getComputedLabel()` / `getComputedRole()` instead of reimplementing ARIA computation manually

## [1.0.0]
- :rocket: Release 1.0.0

## [0.0.4]
- :rocket: added capability of `reuseSession` to reuse same browser across all tests in current worker
```typescript
{
    projects: [
        {
            name: 'debug',
            use: {
                reuseSession: true,
                wdioLaunchOptions: {
                    logLevel: 'error',
                    capabilities: {
                        browserName: 'chrome'
                    },
                }
            }
        }
    ]
}
```

## [0.0.2]
- :rocket: remove logging from sync methods

## [0.0.1]
- :rocket: initial implementation
