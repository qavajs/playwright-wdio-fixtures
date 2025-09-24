import { test as baseTest, expect as baseExpect, ExpectMatcherState } from '@playwright/test';
import { remote, Browser, ChainablePromiseElement } from 'webdriverio';
import { createWdioBrowserProxy } from './WdioBrowser';
import { takeScreenshot } from './snapshot';

export type WdioRemoteOptions = Parameters<typeof remote>[0];

type WebdriverIOFixture = {
    wdioBrowser: Browser;
    $: Browser['$'];
    $$: Browser['$$'];
    takeScreenshot: () => Promise<string>;
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

    $: async ({wdioBrowser}, use) => {
        await use(wdioBrowser.$.bind(wdioBrowser));
    },

    $$: async ({wdioBrowser}, use) => {
        await use(wdioBrowser.$$.bind(wdioBrowser));
    },

    takeScreenshot: [async ({wdioBrowser}, use, testInfo) => {
        await use(takeScreenshot.bind(wdioBrowser, testInfo as any));
    }, { box: true }]
});

type PollExpectOptions = {
    message?: string,
    timeout?: number,
    intervals?: number[]
}

async function exp(expectContext: ExpectMatcherState, getter: any, expected: any, options: PollExpectOptions, assertionName: any) {
    let pass: boolean;
    let matcherResult: any;
    try {
        const expectation = expectContext.isNot
            ? baseExpect.poll(getter, options).not
            : baseExpect.poll(getter, options);
        typeof expected === 'function'
            ? await expected(expectation)
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
            matcherResult;

    return {
        message,
        pass,
        name: assertionName,
        expected,
        actual: matcherResult?.actual,
    };
}

const isDisplayed = (received: ChainablePromiseElement) => () => received.isDisplayed().then(isVisible => isVisible ? 'visible' : 'hidden');
const either = (left: string, right: string) => (isTrue: boolean) => isTrue ? left : right;

export const expect = baseExpect.extend({
    // Element existence and visibility
    async toBeDisplayed(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        return exp(this, isDisplayed(received), 'visible', options, 'toBeDisplayed');
    },

    async toExist(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return exp(this, isExisting, 'exist', options, 'toExist');
    },

    async toBePresent(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return exp(this, isExisting, 'exist', options, 'toBePresent');
    },

    async toBeExisting(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return exp(this, isExisting, 'exist', options, 'toBeExisting');
    },

    async toBeFocused(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isFocused = () => received.isFocused().then(either('focused', 'not focused'));
        return exp(this, isFocused, 'focused', options, 'toBeFocused');
    },

    async toBeVisible(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        return exp(this, isDisplayed(received), 'visible', options, 'toBeVisible');
    },

    async toBeHidden(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isHidden = (received: ChainablePromiseElement) => async () => {
            return (await received.isExisting()) ? isDisplayed(received)() : 'hidden';
        }
        return exp(this, isHidden(received), 'hidden', options, 'toBeHidden');
    },

    async toBeDisplayedInViewport(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isInViewport = () => received.isDisplayed({withinViewport: true}).then(either('in viewport', 'not in viewport'));
        return exp(this, isInViewport, 'in viewport', options, 'toBeDisplayedInViewport');
    },

    // Element state
    async toBeClickable(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isClickable = () => received.isClickable().then(either('clickable', 'not clickable'));
        return exp(this, isClickable, 'clickable', options, 'toBeClickable');
    },

    async toBeDisabled(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isDisabled = () => received.isEnabled().then(either('enabled', 'disabled'));
        return exp(this, isDisabled, 'disabled', options, 'toBeDisabled');
    },

    async toBeEnabled(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isEnabled = () => received.isEnabled().then(either('enabled', 'disabled'));
        return exp(this, isEnabled, 'enabled', options, 'toBeEnabled');
    },

    async toBeSelected(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isSelected = () => received.isSelected().then(either('selected', 'not selected'));
        return exp(this, isSelected, 'selected', options, 'toBeSelected');
    },

    async toBeChecked(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isSelected = () => received.isSelected().then(either('checked', 'unchecked'));
        return exp(this, isSelected, 'checked', options, 'toBeChecked');
    },

    // Attributes and properties
    async toHaveAttribute(received: ChainablePromiseElement, attr: string, expected?: any, options: PollExpectOptions = {}) {
        return exp(this, () => received.getAttribute(attr), expected, options, 'toHaveAttribute');
    },

    async toHaveAttr(received: ChainablePromiseElement, attr: string, expected?: any, options: PollExpectOptions = {}) {
        return exp(this, () => received.getAttribute(attr), expected, options, 'toHaveAttr');
    },

    async toHaveElementClass(received: ChainablePromiseElement, expected: string | string[], options: PollExpectOptions = {}) {
        const hasClass = async () => {
            const className = await received.getAttribute('class') || '';
            return className.split(/\s+/).filter(Boolean);
        };
        const expectedResult = (expectBase: ReturnType<typeof baseExpect>) => expectBase.toEqual(expect.arrayContaining([expected]));
        return exp(this, hasClass, expectedResult, options, 'toHaveElementClass');
    },

    async toHaveElementProperty(received: ChainablePromiseElement, prop: string, expected?: any, options: PollExpectOptions = {}) {
        return exp(this, () => received.getProperty(prop), expected, options, 'toHaveElementProperty');
    },

    async toHaveValue(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        return exp(this, () => received.getValue(), expected, options, 'toHaveValue');
    },

    async toHaveHref(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        return exp(this, () => received.getAttribute('href'), expected, options, 'toHaveHref');
    },

    async toHaveLink(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        return exp(this, () => received.getAttribute('href'), expected, options, 'toHaveLink');
    },

    async toHaveId(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        return exp(this, () => received.getAttribute('id'), expected, options, 'toHaveId');
    },

    // Content matchers
    async toHaveText(received: ChainablePromiseElement, expected?: any, options: PollExpectOptions = {}) {
        return exp(this, () => received.getText(), expected, options, 'toHaveText');
    },

    async toHaveHTML(received: ChainablePromiseElement, expected?: any, options: PollExpectOptions = {}) {
        return exp(this, () => received.getHTML(), expected, options, 'toHaveHTML');
    },

    // Accessibility matchers
    async toHaveComputedLabel(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        const getComputedLabel = async () => {
            try {
                // Try common accessibility label attributes
                let label = await received.getAttribute('aria-label');
                if (label) return label;

                label = await received.getAttribute('aria-labelledby');
                if (label) {
                    // Get text from referenced element(s)
                    try {
                        const labelElement = await received.$(`#${label}`);
                        return await labelElement.getText();
                    } catch {
                        return label;
                    }
                }

                // For form elements, check associated label
                const tagName = await received.getTagName();
                if (['input', 'textarea', 'select'].includes(tagName.toLowerCase())) {
                    const id = await received.getAttribute('id');
                    if (id) {
                        try {
                            const labelElement = await received.$(`label[for="${id}"]`);
                            return await labelElement.getText();
                        } catch {
                            // Continue to fallback
                        }
                    }
                }

                // Fallback to element text
                return await received.getText();
            } catch {
                return '';
            }
        };

        if (expected === undefined) {
            const hasLabel = async () => {
                const label = await getComputedLabel();
                return label !== '' ? 'has computed label' : 'does not have computed label';
            };
            return exp(this, hasLabel, 'has computed label', options, 'toHaveComputedLabel');
        }

        return exp(this, getComputedLabel, expected, options, 'toHaveComputedLabel');
    },

    async toHaveComputedRole(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        const getComputedRole = async () => {
            try {
                // First check explicit role attribute
                let role = await received.getAttribute('role');
                if (role) return role;

                // Fallback to implicit role based on tag name and attributes
                const tagName = (await received.getTagName()).toLowerCase();

                switch (tagName) {
                    case 'button':
                        return 'button';
                    case 'a': {
                        const href = await received.getAttribute('href');
                        return href ? 'link' : 'generic';
                    }
                    case 'input': {
                        const type = await received.getAttribute('type') || 'text';
                        switch (type.toLowerCase()) {
                            case 'button':
                            case 'submit':
                            case 'reset':
                                return 'button';
                            case 'checkbox':
                                return 'checkbox';
                            case 'radio':
                                return 'radio';
                            case 'range':
                                return 'slider';
                            default:
                                return 'textbox';
                        }
                    }
                    case 'textarea':
                        return 'textbox';
                    case 'select':
                        return 'combobox';
                    case 'img':
                        return 'img';
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        return 'heading';
                    case 'nav':
                        return 'navigation';
                    case 'main':
                        return 'main';
                    case 'article':
                        return 'article';
                    case 'section':
                        return 'region';
                    case 'aside':
                        return 'complementary';
                    case 'footer':
                        return 'contentinfo';
                    case 'header':
                        return 'banner';
                    case 'form':
                        return 'form';
                    case 'table':
                        return 'table';
                    case 'ul':
                    case 'ol':
                        return 'list';
                    case 'li':
                        return 'listitem';
                    default:
                        return 'generic';
                }
            } catch {
                return 'generic';
            }
        };

        if (expected === undefined) {
            const hasRole = async () => {
                const role = await getComputedRole();
                return role !== 'generic' ? 'has computed role' : 'does not have computed role';
            };
            return exp(this, hasRole, 'has computed role', options, 'toHaveComputedRole');
        }

        return exp(this, getComputedRole, expected, options, 'toHaveComputedRole');
    },

    // Element structure and children
    async toHaveChildren(received: ChainablePromiseElement, expected?: number, options: PollExpectOptions = {}) {
        const getChildrenCount = async () => {
            try {
                const children = await received.$$('> *');
                return children.length;
            } catch {
                return 0;
            }
        };

        if (expected === undefined) {
            const hasChildren = async () => {
                const count = await getChildrenCount();
                return count > 0 ? 'has children' : 'does not have children';
            };
            return exp(this, hasChildren, 'has children', options, 'toHaveChildren');
        }

        return exp(this, getChildrenCount, expected, options, 'toHaveChildren');
    },

    // Size matchers
    async toHaveWidth(received: ChainablePromiseElement, expected: number, options: PollExpectOptions = {}) {
        const getWidth = async () => {
            const size = await received.getSize();
            return size.width;
        };
        return exp(this, getWidth, expected, options, 'toHaveWidth');
    },

    async toHaveHeight(received: ChainablePromiseElement, expected: number, options: PollExpectOptions = {}) {
        const getHeight = async () => {
            const size = await received.getSize();
            return size.height;
        };
        return exp(this, getHeight, expected, options, 'toHaveHeight');
    },

    async toHaveSize(received: ChainablePromiseElement, expected: {
        width?: number;
        height?: number
    }, options: PollExpectOptions = {}) {
        const getSize = async () => {
            const size = await received.getSize();
            const matches = (!expected.width || size.width === expected.width) &&
                (!expected.height || size.height === expected.height);
            return matches ? 'has size' : 'does not have size';
        };
        return exp(this, getSize, 'has size', options, 'toHaveSize');
    },

    // Collection matchers
    async toBeElementsArrayOfSize(received: ChainablePromiseElement[], expected: number, options: PollExpectOptions = {}) {
        const getLength = () => Promise.resolve(received.length);
        return exp(this, getLength, expected, options, 'toBeElementsArrayOfSize');
    },

    // Browser matchers - keeping the original ones
    async toHaveUrl(received: Browser, expected: any, options: PollExpectOptions = {}): Promise<any> {
        return exp(this, () => received.getUrl(), expected, options, 'toHaveUrl');
    },

    async toHaveTitle(received: Browser, expected: any, options: PollExpectOptions = {}): Promise<any> {
        return exp(this, () => received.getTitle(), expected, options, 'toHaveTitle');
    }
});