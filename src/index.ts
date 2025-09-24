import { test as baseTest, expect as baseExpect, ExpectMatcherState } from '@playwright/test';
import { remote, Browser, ChainablePromiseElement } from 'webdriverio';
import { createWdioBrowserProxy } from './WdioBrowser';

export type WdioRemoteOptions = Parameters<typeof remote>[0];

type WebdriverIOFixture = {
    wdioBrowser: Browser;
    $: Browser['$'];
    $$: Browser['$$'];
}

export type WdioOptions = {
    wdioLaunchOptions: WdioRemoteOptions,
}

export const test = baseTest.extend<WebdriverIOFixture & WdioOptions>({
    wdioLaunchOptions: [{
        logLevel: 'warn',
        capabilities: {
            browserName: 'chrome',
        }
    }, {option: true, box: true}],

    wdioBrowser: async ({wdioLaunchOptions}, use) => {
        const browser = await remote(wdioLaunchOptions);
        await use(createWdioBrowserProxy(browser, test));
        await browser.deleteSession();
    },

    $: async ({ wdioBrowser }, use) => {
        await use(wdioBrowser.$.bind(wdioBrowser));
    },

    $$: async ({ wdioBrowser }, use) => {
        await use(wdioBrowser.$$.bind(wdioBrowser));
    }
});

async function exp(expectContext: ExpectMatcherState, getter: any, expected: any, options: any, assertionName: any) {
    let pass: boolean;
    let matcherResult: any;
    try {
        const expectation = expectContext.isNot
            ? baseExpect.poll(getter).not
            : baseExpect.poll(getter);
        typeof expected === 'function'
            ? await expected()
            : await expectation.toEqual(expected);
        pass = true;
    } catch (e: any) {
        matcherResult = e.message;
        pass = false;
    }

    if (expectContext.isNot) {
        pass = !pass;
    }

    const message = pass
        ? () => expectContext.utils.matcherHint(assertionName, undefined, undefined, {isNot: expectContext.isNot}) +
            '\n\n' +
            `Expected: not ${expectContext.utils.printExpected(expected)}\n` +
            matcherResult
        : () => expectContext.utils.matcherHint(assertionName, undefined, undefined, {isNot: expectContext.isNot}) +
            '\n\n' +
            `Expected: ${expectContext.utils.printExpected(expected)}\n` +
            matcherResult

    return {
        message,
        pass,
        name: assertionName,
        expected,
        actual: matcherResult?.actual,
    };
}

const isDisplayed = (received: ChainablePromiseElement) => () => received.isDisplayed().then(isVisible => isVisible ? 'visible' : 'hidden');

export const expect = baseExpect.extend({
    // element
    async toBeVisible(received: ChainablePromiseElement) {
        return exp(this, isDisplayed(received), 'visible', {}, 'toBeVisible');
    },

    async toBeHidden(received: ChainablePromiseElement) {
        const isHidden = (received: ChainablePromiseElement) => async () => {
            return (await received.isExisting()) ? isDisplayed(received)() : 'hidden';
        }
        return exp(this, isHidden(received), 'hidden', {}, 'toBeHidden');
    },

    async toHaveText(received: ChainablePromiseElement, expected): Promise<any> {
        return exp(this, () => received.getText(), expected, {}, 'toHaveText');
    },

    async toHaveAttribute(received: ChainablePromiseElement, attr: string, expected: any) {
        return exp(this, () => received.getAttribute(attr), expected, {}, 'toHaveAttribute');
    },

    async toHaveValue(received: ChainablePromiseElement, expected: string) {
        return exp(this, () => received.getValue(), expected, {}, 'toHaveValue');
    },

    // browser
    async toHaveUrl(received, expected): Promise<any> {
        return exp(this, () => received.getUrl(), expected, {}, 'toHaveUrl');
    },

    async toHaveTitle(received, expected): Promise<any> {
        return exp(this, () => received.getTitle(), expected, {}, 'toHaveTitle');
    }
});