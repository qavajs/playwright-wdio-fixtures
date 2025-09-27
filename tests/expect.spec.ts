import { test, expect } from './fixture';
import { resolve } from 'node:path';

test.beforeEach(async ({ driver }) => {
    await driver.url(`file:///${resolve(__dirname, './apps/waits.html')}`);
});

test('toExist', async ({ app }) => {
    await expect(app.visibleElement).toExist();
});

test('toBeVisible', async ({ app }) => {
    await expect(app.visibleElement).toBeVisible();
});

test('toBeDisplayedInViewport', async ({ app }) => {
    await expect(app.visibleElement).toBeDisplayedInViewport();
});

test('toBeEnabled', async ({ app }) => {
    await expect(app.enabledButton).toBeEnabled();
});

test('toBeDisabled', async ({ app }) => {
    await expect(app.disabledButton).toBeDisabled();
});

test('toBeFocused', async ({ app }) => {
    await app.loadingInput.click();
    await expect(app.loadingInput).toBeFocused();
});

test('toHaveText', async ({ app }) => {
    await expect(app.visibleElement).toHaveText(expect.stringMatching(/Visible/i));
});

test('toHaveValue', async ({ app }) => {
    await expect(app.loadingInput).toHaveValue('100%');
});

test('toHaveAttribute', async ({ app }) => {
    await expect(app.enabledButton).toHaveAttribute('id', 'enabledButton');
});

test('toHaveElementClass', async ({ app }) => {
    await expect(app.enabledButton).toHaveElementClass('test');
});

test('toHaveId', async ({ app }) => {
    await expect(app.enabledButton).toHaveId('enabledButton');
});

test('toHaveProperty', async ({ app }) => {
    await expect(app.enabledButton).toHaveElementProperty('tagName', 'BUTTON');
});

test('toHaveUrl', async ({ driver }) => {
    await expect(driver).toHaveUrl(expect.stringMatching(/waits/i));
});

test('toHaveUrlContaining', async ({ driver }) => {
    await expect(driver).toHaveUrl(expect.stringContaining('waits'));
});

test('toHaveTitle', async ({ driver }) => {
    await expect(driver).toHaveTitle(expect.stringContaining('title changed'));
});
