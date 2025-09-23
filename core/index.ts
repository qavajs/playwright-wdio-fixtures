import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { remote, Browser } from 'webdriverio';
import { createWdioBrowserProxy } from './WdioBrowser';

export type WdioRemoteOptions = Parameters<typeof remote>[0];

type WebdriverIOFixture = {
    wdioBrowser: Browser
}

export type WdioOptions = {
    wdioLaunchOptions: WdioRemoteOptions
}

export const test = baseTest.extend<WebdriverIOFixture & WdioOptions>({
    wdioLaunchOptions: [{
        logLevel: 'warn',
        capabilities: {
            browserName: 'chrome',
        }
    }, { option: true }],

    wdioBrowser: async ({ wdioLaunchOptions }, use) => {
        const browser = await remote(wdioLaunchOptions);
        await use(createWdioBrowserProxy(browser, test));
        await browser.deleteSession();
    }
});

export const expect = baseExpect.extend({});