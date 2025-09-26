import type { Browser } from 'webdriverio';
import type { TestType } from '@playwright/test';
import { attachSnapshot } from './snapshot';

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

function printableArgs(args: any[]) {
    return args.map(arg => {
        if (typeof arg === 'function') return `function.${arg.name || 'anonymous'}`;
        if (Array.isArray(arg)) return `array`;
        if (typeof arg === 'object') return `object`;
        return args.toString();
    }).join(', ');
}

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
            attachSnapshot(ctx.info() as any, base64);
            return base64;
        }, { location: { file, line, column } });
    });
    return driver;
}
