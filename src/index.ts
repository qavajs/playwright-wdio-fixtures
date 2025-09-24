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
    }, { option: true, box: true }],

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
    async toBeDisplayed(received: ChainablePromiseElement) {
        return exp(this, isDisplayed(received), 'visible', {}, 'toBeDisplayed');
    },

    async toExist(received: ChainablePromiseElement) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return exp(this, isExisting, 'exist', {}, 'toExist');
    },

    async toBePresent(received: ChainablePromiseElement) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return exp(this, isExisting, 'exist', {}, 'toBePresent');
    },

    async toBeExisting(received: ChainablePromiseElement) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return exp(this, isExisting, 'exist', {}, 'toBeExisting');
    },

    async toBeFocused(received: ChainablePromiseElement) {
        const isFocused = () => received.isFocused().then(either('focused', 'not focused'));
        return exp(this, isFocused, 'focused', {}, 'toBeFocused');
    },

    async toBeVisible(received: ChainablePromiseElement) {
        return exp(this, isDisplayed(received), 'visible', {}, 'toBeVisible');
    },

    async toBeHidden(received: ChainablePromiseElement) {
        const isHidden = (received: ChainablePromiseElement) => async () => {
            return (await received.isExisting()) ? isDisplayed(received)() : 'hidden';
        }
        return exp(this, isHidden(received), 'hidden', {}, 'toBeHidden');
    },

    async toBeDisplayedInViewport(received: ChainablePromiseElement) {
        const isInViewport = () => received.isDisplayed({ withinViewport: true }).then(either('in viewport', 'not in viewport'));
        return exp(this, isInViewport, 'in viewport', {}, 'toBeDisplayedInViewport');
    },

    // Element state
    async toBeClickable(received: ChainablePromiseElement) {
        const isClickable = () => received.isClickable().then(either('clickable', 'not clickable'));
        return exp(this, isClickable, 'clickable', {}, 'toBeClickable');
    },

    async toBeDisabled(received: ChainablePromiseElement) {
        const isDisabled = () => received.isEnabled().then(either('enabled', 'disabled'));
        return exp(this, isDisabled, 'disabled', {}, 'toBeDisabled');
    },

    async toBeEnabled(received: ChainablePromiseElement) {
        const isEnabled = () => received.isEnabled().then(either('enabled', 'disabled'));
        return exp(this, isEnabled, 'enabled', {}, 'toBeEnabled');
    },

    async toBeSelected(received: ChainablePromiseElement) {
        const isSelected = () => received.isSelected().then(either('selected', 'not selected'));
        return exp(this, isSelected, 'selected', {}, 'toBeSelected');
    },

    async toBeChecked(received: ChainablePromiseElement) {
        const isSelected = () => received.isSelected().then(either('checked', 'unchecked'));
        return exp(this, isSelected, 'checked', {}, 'toBeChecked');
    },

    // Attributes and properties
    async toHaveAttribute(received: ChainablePromiseElement, attr: string, expected?: any) {
        if (expected === undefined) {
            const hasAttr = async () => {
                const attrValue = await received.getAttribute(attr);
                return attrValue !== null ? 'has attribute' : 'does not have attribute';
            };
            return exp(this, hasAttr, 'has attribute', {}, 'toHaveAttribute');
        }
        return exp(this, () => received.getAttribute(attr), expected, {}, 'toHaveAttribute');
    },

    async toHaveAttr(received: ChainablePromiseElement, attr: string, expected?: any) {
        if (expected === undefined) {
            const hasAttr = async () => {
                const attrValue = await received.getAttribute(attr);
                return attrValue !== null ? 'has attribute' : 'does not have attribute';
            };
            return exp(this, hasAttr, 'has attribute', {}, 'toHaveAttr');
        }
        return exp(this, () => received.getAttribute(attr), expected, {}, 'toHaveAttr');
    },

    async toHaveElementClass(received: ChainablePromiseElement, expected: string | string[]) {
        const hasClass = async () => {
            const className = await received.getAttribute('class') || '';
            return className.split(/\s+/).filter(Boolean);
        };
        const expectedResult = (expectBase: ReturnType<typeof baseExpect>) => expectBase.toEqual(expect.arrayContaining([expected]));
        return exp(this, hasClass, expectedResult, {}, 'toHaveElementClass');
    },

    async toHaveElementProperty(received: ChainablePromiseElement, prop: string, expected?: any) {
        if (expected === undefined) {
            const hasProp = async () => {
                try {
                    const propValue = await received.getProperty(prop);
                    return propValue !== undefined ? 'has property' : 'does not have property';
                } catch {
                    return 'does not have property';
                }
            };
            return exp(this, hasProp, 'has property', {}, 'toHaveElementProperty');
        }
        return exp(this, () => received.getProperty(prop), expected, {}, 'toHaveElementProperty');
    },

    async toHaveValue(received: ChainablePromiseElement, expected?: string) {
        if (expected === undefined) {
            const hasValue = async () => {
                const value = await received.getValue();
                return value !== '' ? 'has value' : 'does not have value';
            };
            return exp(this, hasValue, 'has value', {}, 'toHaveValue');
        }
        return exp(this, () => received.getValue(), expected, {}, 'toHaveValue');
    },

    async toHaveHref(received: ChainablePromiseElement, expected?: string) {
        if (expected === undefined) {
            const hasHref = async () => {
                const href = await received.getAttribute('href');
                return href !== null ? 'has href' : 'does not have href';
            };
            return exp(this, hasHref, 'has href', {}, 'toHaveHref');
        }
        return exp(this, () => received.getAttribute('href'), expected, {}, 'toHaveHref');
    },

    async toHaveLink(received: ChainablePromiseElement, expected?: string) {
        if (expected === undefined) {
            const hasLink = async () => {
                const href = await received.getAttribute('href');
                return href !== null ? 'has link' : 'does not have link';
            };
            return exp(this, hasLink, 'has link', {}, 'toHaveLink');
        }
        return exp(this, () => received.getAttribute('href'), expected, {}, 'toHaveLink');
    },

    async toHaveId(received: ChainablePromiseElement, expected?: string) {
        if (expected === undefined) {
            const hasId = async () => {
                const id = await received.getAttribute('id');
                return id !== null ? 'has id' : 'does not have id';
            };
            return exp(this, hasId, 'has id', {}, 'toHaveId');
        }
        return exp(this, () => received.getAttribute('id'), expected, {}, 'toHaveId');
    },

    // Content matchers
    async toHaveText(received: ChainablePromiseElement, expected?: string | RegExp) {
        return exp(this, () => received.getText(), expected, {}, 'toHaveText');
    },

    async toHaveHTML(received: ChainablePromiseElement, expected?: string | RegExp) {
        return exp(this, () => received.getHTML(), expected, {}, 'toHaveHTML');
    },

    // Accessibility matchers
    async toHaveComputedLabel(received: ChainablePromiseElement, expected?: string) {
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
            return exp(this, hasLabel, 'has computed label', {}, 'toHaveComputedLabel');
        }

        return exp(this, getComputedLabel, expected, {}, 'toHaveComputedLabel');
    },

    async toHaveComputedRole(received: ChainablePromiseElement, expected?: string) {
        const getComputedRole = async () => {
            try {
                // First check explicit role attribute
                let role = await received.getAttribute('role');
                if (role) return role;

                // Fallback to implicit role based on tag name and attributes
                const tagName = (await received.getTagName()).toLowerCase();

                switch (tagName) {
                    case 'button': return 'button';
                    case 'a': {
                        const href = await received.getAttribute('href');
                        return href ? 'link' : 'generic';
                    }
                    case 'input': {
                        const type = await received.getAttribute('type') || 'text';
                        switch (type.toLowerCase()) {
                            case 'button':
                            case 'submit':
                            case 'reset': return 'button';
                            case 'checkbox': return 'checkbox';
                            case 'radio': return 'radio';
                            case 'range': return 'slider';
                            default: return 'textbox';
                        }
                    }
                    case 'textarea': return 'textbox';
                    case 'select': return 'combobox';
                    case 'img': return 'img';
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6': return 'heading';
                    case 'nav': return 'navigation';
                    case 'main': return 'main';
                    case 'article': return 'article';
                    case 'section': return 'region';
                    case 'aside': return 'complementary';
                    case 'footer': return 'contentinfo';
                    case 'header': return 'banner';
                    case 'form': return 'form';
                    case 'table': return 'table';
                    case 'ul':
                    case 'ol': return 'list';
                    case 'li': return 'listitem';
                    default: return 'generic';
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
            return exp(this, hasRole, 'has computed role', {}, 'toHaveComputedRole');
        }

        return exp(this, getComputedRole, expected, {}, 'toHaveComputedRole');
    },

    // Element structure and children
    async toHaveChildren(received: ChainablePromiseElement, expected?: number) {
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
            return exp(this, hasChildren, 'has children', {}, 'toHaveChildren');
        }

        return exp(this, getChildrenCount, expected, {}, 'toHaveChildren');
    },

    // Size matchers
    async toHaveWidth(received: ChainablePromiseElement, expected: number) {
        const getWidth = async () => {
            const size = await received.getSize();
            return size.width;
        };
        return exp(this, getWidth, expected, {}, 'toHaveWidth');
    },

    async toHaveHeight(received: ChainablePromiseElement, expected: number) {
        const getHeight = async () => {
            const size = await received.getSize();
            return size.height;
        };
        return exp(this, getHeight, expected, {}, 'toHaveHeight');
    },

    async toHaveSize(received: ChainablePromiseElement, expected: { width?: number; height?: number }) {
        const getSize = async () => {
            const size = await received.getSize();
            const matches = (!expected.width || size.width === expected.width) &&
                (!expected.height || size.height === expected.height);
            return matches ? 'has size' : 'does not have size';
        };
        return exp(this, getSize, 'has size', {}, 'toHaveSize');
    },

    // Collection matchers
    async toBeElementsArrayOfSize(received: ChainablePromiseElement[], expected: number) {
        const getLength = () => Promise.resolve(received.length);
        return exp(this, getLength, expected, {}, 'toBeElementsArrayOfSize');
    },

    // Browser matchers - keeping the original ones
    async toHaveUrl(received, expected): Promise<any> {
        return exp(this, () => received.getUrl(), expected, {}, 'toHaveUrl');
    },

    async toHaveTitle(received, expected): Promise<any> {
        return exp(this, () => received.getTitle(), expected, {}, 'toHaveTitle');
    }
});