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

// Aliases of toBeDisplayed / toBeVisible
test('toBeDisplayed', async ({ app }) => {
    await expect(app.visibleElement).toBeDisplayed();
});

// Aliases of toExist
test('toBePresent', async ({ app }) => {
    await expect(app.presentElement).toBePresent();
});

test('toBeExisting', async ({ app }) => {
    await expect(app.presentElement).toBeExisting();
});

// Hidden — element starts visible, transitions to hidden
test('toBeHidden', async ({ app }) => {
    await expect(app.hiddenElement).toBeHidden();
});

// Negated matchers exercise the isNot polling path
test('not.toBeDisplayed', async ({ app }) => {
    await expect(app.hiddenElement).not.toBeDisplayed();
});

test('not.toExist', async ({ app }) => {
    await expect(app.detachElement).not.toExist();
});

// Collection matcher
test('toBeElementsArrayOfSize', async ({ $$ }) => {
    const buttons = await $$('button');
    await expect(buttons).toBeElementsArrayOfSize(2);
});

// Accessibility matchers — delegate to native WDIO getComputedLabel / getComputedRole
test('toHaveComputedLabel', async ({ app }) => {
    await expect(app.loadingInput).toHaveComputedLabel('Loading Input');
});

test('toHaveComputedRole', async ({ app }) => {
    await expect(app.enabledButton).toHaveComputedRole('button');
});
