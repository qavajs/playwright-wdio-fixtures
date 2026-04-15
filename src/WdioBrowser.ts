import type { Browser } from 'webdriverio';
import type { TestType } from '@playwright/test';
import { attachScreenshot } from './snapshot';

const loggableBrowser = [
    'addInitScript',
    'debug',
    'deepLink',
    'deleteCookies',
    'downloadFile',
    'emulate',
    'execute',
    'executeAsync',
    'getContext',
    'getContexts',
    'getCookies',
    'getPuppeteer',
    'getWindowSize',
    'getUrl',
    'getTitle',
    'keys',
    'mock',
    'mockClearAll',
    'mockRestoreAll',
    'newWindow',
    'pause',
    'relaunchActiveApp',
    'reloadSession',
    'restore',
    'savePDF',
    'saveRecordingScreen',
    'saveScreenshot',
    'scroll',
    'setCookies',
    'setTimeout',
    'setViewport',
    'setWindowSize',
    'swipe',
    'switchContext',
    'switchFrame',
    'switchWindow',
    'tap',
    'throttle',
    'throttleCPU',
    'throttleNetwork',
    'touchAction',
    'uploadFile',
    'url',
    'waitUntil',
];

const loggableElement = [
    'clearValue',
    'doubleClick',
    'dragAndDrop',
    'execute',
    'executeAsync',
    'getCSSProperty',
    'getComputedLabel',
    'getComputedRole',
    'getElement',
    'getHTML',
    'getLocation',
    'getProperty',
    'getSize',
    'getTagName',
    'getValue',
    'isClickable',
    'isDisplayed',
    'isEnabled',
    'isEqual',
    'isExisting',
    'isFocused',
    'isSelected',
    'isStable',
    'longPress',
    'moveTo',
    'pinch',
    'saveScreenshot',
    'scrollIntoView',
    'selectByAttribute',
    'selectByIndex',
    'selectByVisibleText',
    'setValue',
    'tap',
    'touchAction',
    'waitForClickable',
    'waitForEnabled',
    'waitForExist',
    'waitForStable',
    'waitUntil',
    'zoom',
    'click',
    'addValue',
    'waitForDisplayed',
    'getText',
    'getAttribute',
];

/**
 * Serialises an argument list into a human-readable string for use in step titles.
 *
 * Each argument is converted to a concise token:
 * - Functions  → `function.<name>` (or `function.anonymous`)
 * - Arrays     → `array`
 * - `null`     → `null`
 * - Objects    → `object`
 * - `undefined`→ `undefined`
 * - Everything else → `String(arg)`
 *
 * @param args - The raw arguments passed to a WebdriverIO command.
 * @returns A comma-separated string suitable for embedding in a trace step title.
 */
function printableArgs(args: any[]) {
    return args.map(arg => {
        if (typeof arg === 'function') return `function.${arg.name || `anonymous`}`;
        if (Array.isArray(arg)) return `array`;
        if (arg === null) return `null`;
        if (typeof arg === 'object') return `object`;
        if (arg === undefined) return `undefined`;
        return arg?.toString();
    }).join(', ');
}

/**
 * Wraps a WebdriverIO `Browser` instance so that its commands surface as named steps in the
 * Playwright test report and trace viewer.
 *
 * For every command listed in {@link loggableBrowser} and {@link loggableElement}, the original
 * implementation is replaced via `browser.overwriteCommand` with a wrapper that:
 *
 * 1. Reads the current source location from `ctx.info()`.
 * 2. Builds a human-readable title (`driver.<method>(args)` or `$(<selector>).<method>(args)`).
 * 3. Delegates to `ctx.step()`, which registers the call as a named step in Playwright's trace.
 *
 * The `takeScreenshot` command receives additional handling: after the screenshot is taken the
 * resulting base64 data is forwarded to {@link attachScreenshot} so it appears as an image frame
 * inside the Playwright trace viewer.
 *
 * Commands whose return value is not a Promise are passed through immediately without wrapping, so
 * synchronous accessors are not affected.
 *
 * @param driver - The WebdriverIO `Browser` instance to instrument.
 * @param ctx - The Playwright `TestType` context used for step registration and location info.
 * @returns The same `driver` instance, mutated in place with overwritten commands.
 */
export function createWdioDriverProxy(driver: Browser, ctx: TestType<any, any>) {
    for (const method of loggableBrowser) {
        driver.overwriteCommand(method as any, function (originalCommand, ...args) {
            const { file, line, column } = ctx.info();
            const title = `driver.${method}(${printableArgs(args)})`;
            const result = originalCommand(...args);
            if (!result.then) return result;
            return ctx.step(title, () => result, { location: { file, line, column } });
        });
    }
    for (const method of loggableElement) {
        driver.overwriteCommand(method as any, function (originalCommand, ...args) {
            const { file, line, column } = ctx.info();
            const title = `$(${this.selector}).${method}(${printableArgs(args)})`;
            const result = originalCommand(...args);
            if (!result.then) return result;
            return ctx.step(title, () => result, { location: { file, line, column } });
        }, true);
    }
    driver.overwriteCommand('takeScreenshot' as any, function (originalCommand, ...args) {
        const { file, line, column } = ctx.info();
        const title = `driver.takeScreenshot()`;
        return ctx.step(title, async () => {
            const base64 = await originalCommand(...args);
            attachScreenshot(ctx.info() as any, base64);
            return base64;
        }, { location: { file, line, column } });
    });
    return driver;
}
