import type { Browser } from 'webdriverio';
import type { TestType } from '@playwright/test';

const loggableBrowser = [
    'action',
    'actions',
    'addInitScript',
    'call',
    'custom$',
    'custom$$',
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
    'keys',
    'mock',
    'mockClearAll',
    'mockRestoreAll',
    'newWindow',
    'pause',
    'react$',
    'react$$',
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
    'nextElement',
    'parentElement',
    'pinch',
    'previousElement',
    'react$',
    'react$$',
    'saveScreenshot',
    'scrollIntoView',
    'selectByAttribute',
    'selectByIndex',
    'selectByVisibleText',
    'setValue',
    'shadow$',
    'shadow$$',
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
        if (Array.isArray(arg)) return `[array]`;
        if (typeof arg === 'object') return `{object}`;
        return args.toString();
    }).join(', ');
}

export function createWdioBrowserProxy(browser: Browser, ctx: TestType<any, any>) {

    for (const method of loggableBrowser) {
        browser.overwriteCommand(method as any, async function (originalCommand, ...args) {
            const title = `browser.${method}(${printableArgs(args)})`;
            return ctx.step(title, () => originalCommand(...args), { box: true });
        });
    }
    for (const method of loggableElement) {
        browser.overwriteCommand(method as any, async function (originalCommand, ...args) {
            const title = `$(${this.selector}).${method}(${printableArgs(args)})`;
            return ctx.step(title, () => originalCommand(...args), { box: true });
        }, true);
    }
    return browser;
}
