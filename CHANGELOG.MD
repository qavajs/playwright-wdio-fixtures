# Change Log

All notable changes to the "@qavajs/playwright-wdio-fixtures" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature

:beetle: - bugfix

:x: - deprecation/removal

:pencil: - chore

:microscope: - experimental

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
