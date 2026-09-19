# Change Log

All notable changes to the "@qavajs/playwright-wdio-fixtures" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature

:beetle: - bugfix

:x: - deprecation/removal

:pencil: - chore

:microscope: - experimental

## [1.4.0]
- :rocket: flattened the playwright trace: across the test suite, maximum step depth dropped from 6 to 2 and total step count by 27%
  - WebdriverIO commands delegate to each other internally (`setValue` → `clearValue` + `addValue`, `getHTML` → `execute` → `waitForExist` → `waitUntil` → `isExisting`), and every one of those calls went through the same `overwriteCommand` wrapper — burying the call the test actually made under several levels of WebdriverIO implementation detail. Only the outermost command is reported now
  - added `src/steps.ts`, which tracks the in-progress command in an `AsyncLocalStorage` rather than a flag, so concurrent top-level commands (`Promise.all`, iterating a `$$` collection) still each get their own step
- :rocket: polling matchers no longer delegate to `expect.poll()`, which invokes the underlying matcher — and therefore opens a step — once per attempt; an assertion that waited a second landed in the trace as a dozen near-identical children. `verify` now runs its own retry loop (keeping playwright's `[100, 250, 500, 1000]` intervals and the configured expect timeout) with WebdriverIO command reporting suppressed, so every assertion contributes exactly one step whose duration covers the full wait
- :beetle: fixed `actual` in the matcher result always being `undefined`, since it was read off an error message string; failure output now carries a real `Received:` line instead of burying it in the nested poll error
- :pencil: `toHaveElementClass` passes `expect.arrayContaining` to `verify` directly instead of through a higher-order assertion callback, which `verify` no longer accepts

> Note: commands issued inside a callback passed to a WebdriverIO command — e.g. `driver.waitUntil(async () => { await $('#x').click(); })` — are no longer reported as steps, since they run within a command.

## [1.3.0]
- :beetle: fixed screenshots not being displayed in the trace viewer on playwright 1.63+ (trace format v9), which links snapshots to actions via `snapshot.phase` instead of the `afterSnapshot` / `snapshotName` pair; both are now emitted so older playwright versions keep working
- :pencil: injected screenshot action now carries a `title` so it is labelled in the trace viewer action list
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
