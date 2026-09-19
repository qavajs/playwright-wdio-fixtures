import { test as baseTest, expect as baseExpect, ExpectMatcherState } from '@playwright/test';
import { remote, Browser, ChainablePromiseElement, ChainablePromiseArray } from 'webdriverio';
import { createWdioDriverProxy } from './WdioBrowser';
import { withoutSteps } from './steps';

/** Options accepted by `webdriverio.remote()`. Re-exported for consumer convenience. */
export type WdioRemoteOptions = Parameters<typeof remote>[0];

/** Per-test fixtures injected by the extended `test` object. */
type WebdriverIOFixture = {
    /** The instrumented WebdriverIO `Browser` instance for the current test. */
    driver: Browser;
    /** Shorthand for `driver.$` — queries a single element. */
    $: Browser['$'];
    /** Shorthand for `driver.$$` — queries multiple elements. */
    $$: Browser['$$'];
}

/** Worker-scoped fixtures managed internally by the extended `test` object. */
type WebdriverIOWorkerFixture = {
    /** Merged launch options (including {@link AdditionalWdioOptions}) used for this worker. */
    wdioLaunchOptions: WdioRemoteOptions & AdditionalWdioOptions;
    /**
     * A shared `Browser` instance reused across all tests in the worker, or `null` when session
     * reuse is disabled.
     */
    workerDriver: Browser | null;
}

/**
 * Public options type exposed to consumers who want to override `wdioLaunchOptions` in their
 * Playwright config or `test.use()` calls.
 */
export type WdioOptions = {
    wdioLaunchOptions: WdioRemoteOptions & AdditionalWdioOptions;
}

type AdditionalWdioOptions = {
    /**
     * Defines whether browser should be created as worker fixture
     * and reused across all tests in the current worker.
     */
    reuseSession?: boolean;
};

/**
 * Playwright `test` extended with WebdriverIO browser fixtures.
 *
 * Provides three fixtures out of the box:
 *
 * - **`driver`** — a WebdriverIO `Browser` instrumented to emit Playwright trace steps.
 *   When `wdioLaunchOptions.reuseSession` is `true` the worker-level `workerDriver` is returned
 *   instead of creating a new session per test.
 * - **`$`** — bound alias of `driver.$`.
 * - **`$$`** — bound alias of `driver.$$`.
 *
 * Two worker-scoped fixtures are also registered:
 *
 * - **`wdioLaunchOptions`** (option) — merged `WdioRemoteOptions` + `AdditionalWdioOptions`.
 *   Defaults to `{ logLevel: 'warn', capabilities: { browserName: 'chrome' } }`.
 * - **`workerDriver`** — a shared session created once per worker when `reuseSession` is `true`,
 *   cleaned up via `browser.deleteSession()` after all worker tests complete.
 *
 * @example
 * ```ts
 * import { test } from '@qavajs/playwright-wdio-fixtures';
 *
 * test('navigate', async ({ driver, $ }) => {
 *   await driver.url('https://example.com');
 *   const heading = await $('h1');
 *   await expect(heading).toHaveText('Example Domain');
 * });
 * ```
 */
export const test = baseTest.extend<WebdriverIOFixture, WebdriverIOWorkerFixture & WdioOptions>({
    wdioLaunchOptions: [{
        logLevel: 'warn',
        capabilities: {
            browserName: 'chrome',
        }
    }, { option: true, box: true, scope: 'worker' }],

    workerDriver: [async ({ wdioLaunchOptions }, use) => {
        if (wdioLaunchOptions.reuseSession) {
            const browser = await remote(wdioLaunchOptions);
            await use(createWdioDriverProxy(browser, test));
            await browser.deleteSession();
        } else {
            await use(null);
        }
    }, { scope: 'worker' }],

    driver: async ({ wdioLaunchOptions, workerDriver }, use) => {
        if (wdioLaunchOptions.reuseSession && workerDriver) {
            await use(workerDriver);
        } else {
            const browser = await remote(wdioLaunchOptions);
            await use(createWdioDriverProxy(browser, test));
            await browser.deleteSession();
        }
    },

    $: async ({ driver }, use) => {
        await use(driver.$.bind(driver));
    },

    $$: async ({ driver }, use) => {
        await use(driver.$$.bind(driver));
    }
});

/** Options accepted by all polling-based matchers. */
type PollExpectOptions = {
    /** Custom failure message prepended to the assertion error. */
    message?: string,
    /** Maximum time in milliseconds to keep polling before the assertion fails. */
    timeout?: number,
    /** Custom polling intervals in milliseconds between retries. */
    intervals?: number[]
}

/** Retry delays used when {@link PollExpectOptions.intervals} is not supplied. */
const DEFAULT_INTERVALS = [100, 250, 500, 1000];

/** Detects a jest/Playwright asymmetric matcher such as `expect.stringContaining('x')`. */
function isAsymmetricMatcher(value: unknown): value is { asymmetricMatch(other: unknown): boolean } {
    return typeof (value as { asymmetricMatch?: unknown } | null)?.asymmetricMatch === 'function';
}

/** Returns the keys of `value` that are not explicitly `undefined`, the way `toEqual` compares. */
function definedKeys(value: object): string[] {
    return Object.keys(value).filter(key => (value as Record<string, unknown>)[key] !== undefined);
}

/**
 * `toEqual`-style structural comparison: recurses into arrays and plain objects, ignores properties
 * explicitly set to `undefined`, and defers to asymmetric matchers wherever they appear.
 *
 * {@link verify} compares with this rather than calling `expect` on every poll — see the note there.
 */
function equals(actual: unknown, expected: unknown): boolean {
    if (isAsymmetricMatcher(expected)) return expected.asymmetricMatch(actual);
    if (actual === expected || Object.is(actual, expected)) return true;
    if (Array.isArray(expected)) {
        return Array.isArray(actual)
            && actual.length === expected.length
            && expected.every((item, index) => equals(actual[index], item));
    }
    if (typeof expected !== 'object' || typeof actual !== 'object' || expected === null || actual === null) return false;
    const expectedKeys = definedKeys(expected);
    return expectedKeys.length === definedKeys(actual).length
        && expectedKeys.every(key => equals((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key]));
}

/**
 * Core polling assertion helper used by every custom matcher in this module.
 *
 * Re-reads `getter` until its value satisfies `expected` (or stops satisfying it, for a negated
 * assertion such as `expect(el).not.toBeDisplayed()`), giving up after `options.timeout`
 * milliseconds. An exception thrown by `getter` is final and is not retried.
 *
 * Polling is deliberately hand-rolled instead of delegating to `baseExpect.poll()`: `poll` invokes
 * the underlying matcher once per attempt, and each invocation opens its own step, so a single
 * assertion that waits a second lands in the trace as a dozen near-identical children. The whole
 * loop also runs inside {@link withoutSteps}, so the WebdriverIO commands it issues on each retry
 * stay out of the trace as well. The assertion therefore contributes exactly one step, whose
 * duration covers the full wait.
 *
 * @param expectContext - The `ExpectMatcherState` provided by Playwright to the custom matcher.
 * @param getter - An async factory that reads the current element/browser state.
 * @param expected - The expected value; may be an asymmetric matcher such as `expect.stringContaining('x')`.
 * @param options - Polling options (timeout, intervals, message).
 * @param assertionName - The matcher name used in failure messages (e.g. `'toBeDisplayed'`).
 * @returns A Playwright custom-matcher result object.
 */
async function verify(expectContext: ExpectMatcherState, getter: () => Promise<unknown>, expected: unknown, options: PollExpectOptions, assertionName: string) {
    const timeout = options.timeout ?? expectContext.timeout;
    const intervals = options.intervals ?? DEFAULT_INTERVALS;
    const deadline = Date.now() + timeout;

    let actual: unknown;
    let error: Error | undefined;
    let satisfied = false;

    await withoutSteps(async () => {
        for (let attempt = 0; ; attempt++) {
            try {
                actual = await getter();
            } catch (e: any) {
                error = e;
                return;
            }
            satisfied = equals(actual, expected) !== expectContext.isNot;
            if (satisfied || Date.now() >= deadline) return;
            await new Promise(resolve => setTimeout(resolve, intervals[Math.min(attempt, intervals.length - 1)]));
        }
    });

    const message = () => {
        const hint = expectContext.utils.matcherHint(assertionName, undefined, undefined, { isNot: expectContext.isNot });
        const details = error
            ? error.message
            : `Expected: ${expectContext.isNot ? 'not ' : ''}${expectContext.utils.printExpected(expected)}\n` +
              `Received: ${expectContext.utils.printReceived(actual)}\n` +
              `Timed out ${timeout}ms waiting for ${assertionName}`;
        return [hint, options.message, details].filter(Boolean).join('\n\n');
    };

    return {
        message,
        // Playwright re-applies the negation itself, so report the un-negated outcome.
        pass: expectContext.isNot ? !satisfied : satisfied,
        name: assertionName,
        expected,
        actual,
    };
}

/** Returns a polling getter that resolves to `'visible'` or `'hidden'` for an element. */
const isDisplayed = (received: ChainablePromiseElement) => () => received.isDisplayed().then(isVisible => isVisible ? 'visible' : 'hidden');

/**
 * Curried helper that maps a boolean to one of two string tokens.
 *
 * Used to convert WebdriverIO boolean results (e.g. `isEnabled()`) into the string values that
 * `verify` compares against (e.g. `'enabled'` / `'disabled'`).
 */
const either = (left: string, right: string) => (isTrue: boolean) => isTrue ? left : right;

type StringAsymentric = string | ReturnType<typeof baseExpect.stringContaining>;

/**
 * Playwright `expect` extended with WebdriverIO-compatible element and browser matchers.
 *
 * All matchers use `expect.poll()` internally so they retry until the assertion passes or the
 * configured `timeout` is exceeded. Every matcher accepts an optional {@link PollExpectOptions}
 * as its last argument.
 *
 * **Element existence and visibility**
 * - `toBeDisplayed` / `toBeVisible` — element is visible in the DOM.
 * - `toExist` / `toBePresent` / `toBeExisting` — element exists in the DOM.
 * - `toBeHidden` — element is hidden or absent from the DOM.
 * - `toBeDisplayedInViewport` — element is visible within the current viewport.
 *
 * **Element state**
 * - `toBeClickable` — element is clickable.
 * - `toBeEnabled` / `toBeDisabled` — element enabled/disabled state.
 * - `toBeFocused` — element has focus.
 * - `toBeSelected` / `toBeChecked` — element selection/checked state.
 *
 * **Attributes and properties**
 * - `toHaveAttribute` / `toHaveAttr` — element has an attribute with an optional expected value.
 * - `toHaveElementClass` — element's `class` attribute contains the expected class name(s).
 * - `toHaveElementProperty` — element has a DOM property with an optional expected value.
 * - `toHaveValue` — form element has the expected value.
 * - `toHaveHref` / `toHaveLink` — anchor element has the expected `href`.
 * - `toHaveId` — element has the expected `id` attribute.
 *
 * **Content**
 * - `toHaveText` — element's text content matches the expected value.
 * - `toHaveHTML` — element's inner HTML matches the expected value.
 *
 * **Accessibility**
 * - `toHaveComputedLabel` — element has the expected accessible label (derived from `aria-label`,
 *   `aria-labelledby`, associated `<label>`, or visible text).
 * - `toHaveComputedRole` — element has the expected ARIA role (explicit `role` attribute or
 *   implicit role inferred from the tag name).
 *
 * **Size**
 * - `toHaveWidth` / `toHaveHeight` — element has the expected dimension in pixels.
 * - `toHaveSize` — element has both expected width and height.
 *
 * **Collections**
 * - `toBeElementsArrayOfSize` — an array of elements has the expected length.
 *
 * **Browser**
 * - `toHaveUrl` — current page URL matches the expected value.
 * - `toHaveTitle` — current page title matches the expected value.
 */
export const expect = baseExpect.extend({
    // Element existence and visibility
    async toBeDisplayed(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        return verify(this, isDisplayed(received), 'visible', options, 'toBeDisplayed');
    },

    async toExist(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return verify(this, isExisting, 'exist', options, 'toExist');
    },

    async toBePresent(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return verify(this, isExisting, 'exist', options, 'toBePresent');
    },

    async toBeExisting(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isExisting = () => received.isExisting().then(either('exist', 'not exist'));
        return verify(this, isExisting, 'exist', options, 'toBeExisting');
    },

    async toBeFocused(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isFocused = () => received.isFocused().then(either('focused', 'not focused'));
        return verify(this, isFocused, 'focused', options, 'toBeFocused');
    },

    async toBeVisible(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        return verify(this, isDisplayed(received), 'visible', options, 'toBeVisible');
    },

    async toBeHidden(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isHidden = (received: ChainablePromiseElement) => async () => {
            return (await received.isExisting()) ? isDisplayed(received)() : 'hidden';
        }
        return verify(this, isHidden(received), 'hidden', options, 'toBeHidden');
    },

    async toBeDisplayedInViewport(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isInViewport = () => received.isDisplayed({ withinViewport: true }).then(either('in viewport', 'not in viewport'));
        return verify(this, isInViewport, 'in viewport', options, 'toBeDisplayedInViewport');
    },

    // Element state
    async toBeClickable(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isClickable = () => received.isClickable().then(either('clickable', 'not clickable'));
        return verify(this, isClickable, 'clickable', options, 'toBeClickable');
    },

    async toBeDisabled(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isDisabled = () => received.isEnabled().then(either('enabled', 'disabled'));
        return verify(this, isDisabled, 'disabled', options, 'toBeDisabled');
    },

    async toBeEnabled(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isEnabled = () => received.isEnabled().then(either('enabled', 'disabled'));
        return verify(this, isEnabled, 'enabled', options, 'toBeEnabled');
    },

    async toBeSelected(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isSelected = () => received.isSelected().then(either('selected', 'not selected'));
        return verify(this, isSelected, 'selected', options, 'toBeSelected');
    },

    async toBeChecked(received: ChainablePromiseElement, options: PollExpectOptions = {}) {
        const isSelected = () => received.isSelected().then(either('checked', 'unchecked'));
        return verify(this, isSelected, 'checked', options, 'toBeChecked');
    },

    // Attributes and properties
    async toHaveAttribute(received: ChainablePromiseElement, attr: string, expected?: any, options: PollExpectOptions = {}) {
        return verify(this, () => received.getAttribute(attr), expected, options, 'toHaveAttribute');
    },

    async toHaveAttr(received: ChainablePromiseElement, attr: string, expected?: any, options: PollExpectOptions = {}) {
        return verify(this, () => received.getAttribute(attr), expected, options, 'toHaveAttr');
    },

    async toHaveElementClass(received: ChainablePromiseElement, expected: string | string[], options: PollExpectOptions = {}) {
        const hasClass = async () => {
            const className = await received.getAttribute('class') || '';
            return className.split(/\s+/).filter(Boolean);
        };
        const classes = Array.isArray(expected) ? expected : [expected];
        return verify(this, hasClass, baseExpect.arrayContaining(classes), options, 'toHaveElementClass');
    },

    async toHaveElementProperty(received: ChainablePromiseElement, prop: string, expected?: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getProperty(prop), expected, options, 'toHaveElementProperty');
    },

    async toHaveValue(received: ChainablePromiseElement, expected: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getValue(), expected, options, 'toHaveValue');
    },

    async toHaveHref(received: ChainablePromiseElement, expected: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getAttribute('href'), expected, options, 'toHaveHref');
    },

    async toHaveLink(received: ChainablePromiseElement, expected?: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getAttribute('href'), expected, options, 'toHaveLink');
    },

    async toHaveId(received: ChainablePromiseElement, expected?: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getAttribute('id'), expected, options, 'toHaveId');
    },

    // Content matchers
    async toHaveText(received: ChainablePromiseElement, expected?: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getText(), expected, options, 'toHaveText');
    },

    async toHaveHTML(received: ChainablePromiseElement, expected?: StringAsymentric, options: PollExpectOptions = {}) {
        return verify(this, () => received.getHTML(), expected, options, 'toHaveHTML');
    },

    // Accessibility matchers
    async toHaveComputedLabel(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        if (expected === undefined) {
            const hasLabel = async () => {
                const label = await received.getComputedLabel();
                return label ? 'has computed label' : 'does not have computed label';
            };
            return verify(this, hasLabel, 'has computed label', options, 'toHaveComputedLabel');
        }
        return verify(this, () => received.getComputedLabel(), expected, options, 'toHaveComputedLabel');
    },

    async toHaveComputedRole(received: ChainablePromiseElement, expected?: string, options: PollExpectOptions = {}) {
        if (expected === undefined) {
            const hasRole = async () => {
                const role = await received.getComputedRole();
                return role && role !== 'generic' ? 'has computed role' : 'does not have computed role';
            };
            return verify(this, hasRole, 'has computed role', options, 'toHaveComputedRole');
        }
        return verify(this, () => received.getComputedRole(), expected, options, 'toHaveComputedRole');
    },

    // Size matchers
    async toHaveWidth(received: ChainablePromiseElement, expected: number, options: PollExpectOptions = {}) {
        const getWidth = async () => {
            const size = await received.getSize();
            return size.width;
        };
        return verify(this, getWidth, expected, options, 'toHaveWidth');
    },

    async toHaveHeight(received: ChainablePromiseElement, expected: number, options: PollExpectOptions = {}) {
        const getHeight = async () => {
            const size = await received.getSize();
            return size.height;
        };
        return verify(this, getHeight, expected, options, 'toHaveHeight');
    },

    async toHaveSize(received: ChainablePromiseElement, expected: {
        width?: number;
        height?: number
    }, options: PollExpectOptions = {}) {
        const getSize = async () => {
            const { width, height } = await received.getSize();
            const result: { width?: number; height?: number } = {};
            if (expected.width !== undefined) result.width = width;
            if (expected.height !== undefined) result.height = height;
            return result;
        };
        return verify(this, getSize, expected, options, 'toHaveSize');
    },

    // Collection matchers
    async toBeElementsArrayOfSize(received: ChainablePromiseArray, expected: number, options: PollExpectOptions = {}) {
        const getLength = () => Promise.resolve(received.length);
        return verify(this, getLength, expected, options, 'toBeElementsArrayOfSize');
    },

    // Browser matchers - keeping the original ones
    async toHaveUrl(received: Browser, expected: any, options: PollExpectOptions = {}): Promise<any> {
        return verify(this, () => received.getUrl(), expected, options, 'toHaveUrl');
    },

    async toHaveTitle(received: Browser, expected: any, options: PollExpectOptions = {}): Promise<any> {
        return verify(this, () => received.getTitle(), expected, options, 'toHaveTitle');
    }
});