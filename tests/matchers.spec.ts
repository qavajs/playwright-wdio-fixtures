import { test, expect } from './fixture';
import { resolve } from 'node:path';

const page = (name: string) => `file:///${resolve(__dirname, `./apps/${name}.html`)}`;

test.describe('presence checks when expected is omitted', () => {
    test.beforeEach(async ({ driver }) => {
        await driver.url(page('values'));
    });

    test('toHaveAttribute / toHaveAttr', async ({ app }) => {
        await expect(app.simpleTextInput).toHaveAttribute('name');
        await expect(app.simpleTextInput).toHaveAttr('name');
        await expect(app.simpleTextInput).not.toHaveAttribute('data-missing');
    });

    test('toHaveElementProperty', async ({ app }) => {
        await expect(app.simpleTextInput).toHaveElementProperty('value');
        await expect(app.simpleTextInput).not.toHaveElementProperty('missingProperty');
    });

    test('toHaveLink / toHaveId', async ({ app }) => {
        await expect(app.link).toHaveLink();
        await expect(app.link).toHaveId();
        await expect(app.simpleTextElement).not.toHaveLink();
    });

    test('toHaveText / toHaveHTML', async ({ app }) => {
        await expect(app.simpleTextElement).toHaveText();
        await expect(app.simpleTextElement).toHaveHTML();
        await expect(app.sizedBox).not.toHaveText();
    });
});

test.describe('RegExp expectations', () => {
    test.beforeEach(async ({ driver }) => {
        await driver.url(page('values'));
    });

    test('string matchers accept a RegExp', async ({ app, driver }) => {
        await expect(app.simpleTextElement).toHaveText(/^text val/);
        await expect(app.simpleTextElement).not.toHaveText(/nope/);
        await expect(app.simpleTextInput).toHaveValue(/\d{3}/);
        await expect(app.link).toHaveHref(/frame\.html$/);
        await expect(driver).toHaveUrl(/values\.html$/);
    });

    test('a global RegExp gives the same answer on every poll', async ({ app }) => {
        const re = /text/g;
        await expect(app.simpleTextElement).toHaveText(re);
        await expect(app.simpleTextElement).toHaveText(re);
    });
});

test.describe('polling', () => {
    test.beforeEach(async ({ driver }) => {
        await driver.url(page('waits'));
    });

    test('toBeElementsArrayOfSize re-queries an awaited collection', async ({ $$ }) => {
        // the page appends one element every 200ms until there are 10
        const items = await $$('#waitCollection > div');
        expect(items.length).toBeLessThan(10);
        await expect(items).toBeElementsArrayOfSize(10);
    });

    test('toBeElementsArrayOfSize re-queries an unawaited collection', async ({ $$ }) => {
        await expect($$('#waitCollection > div')).toBeElementsArrayOfSize(10);
    });

    test('a negated matcher fails, rather than passes, on a missing element', async ({ $ }) => {
        const error = await expect($('#doesNotExist')).not.toHaveText('anything', { timeout: 500 }).catch(e => e);
        expect(error).toBeInstanceOf(Error);
    });

    test('an assertion gives up at its own timeout despite WebdriverIO implicit waits', async ({ $ }) => {
        const start = Date.now();
        const error = await expect($('#doesNotExist')).toHaveText('anything', { timeout: 500 }).catch(e => e);
        expect(error.message).toMatch(/did not finish within 500ms/);
        expect(Date.now() - start).toBeLessThan(2000);
    });
});
