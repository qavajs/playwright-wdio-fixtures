import type { Browser } from 'webdriverio';
import type { TestType } from '@playwright/test';

const loggableBrowser = [
    'url',
    'getUrl'
];

const loggableElement = [
    'click',
    'addValue',
    'waitForDisplayed'
];

export function createWdioBrowserProxy(browser: Browser, ctx: TestType<any, any>) {
    for (const method of loggableBrowser) {
        browser.overwriteCommand(method as any, async function (originalCommand, ...args) {
            const title = `browser.${method}(${args})`;
            return ctx.step(title, () => originalCommand(...args));
        });
    }
    for (const method of loggableElement) {
        browser.overwriteCommand(method as any, async function (originalCommand, ...args) {
            const title = `$(${this.selector}).${method}(${args})`;
            return ctx.step(title, () => originalCommand(...args));
        }, true);
    }
    return browser;
}
