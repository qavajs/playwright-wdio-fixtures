import { test, expect } from './fixture';
import { resolve } from 'node:path';

test.beforeEach(async ({ driver }) => {
    await driver.url(`file:///${resolve(__dirname, './apps/values.html')}`);
});

// Attribute alias
test('toHaveAttr', async ({ app }) => {
    await expect(app.simpleTextInput).toHaveAttr('name', 'textInputName');
});

// HTML content
test('toHaveHTML', async ({ app }) => {
    await expect(app.simpleTextElement).toHaveHTML(expect.stringContaining('text value'));
});

// Anchor href matchers
test('toHaveHref', async ({ app }) => {
    await expect(app.link).toHaveHref(expect.stringContaining('frame.html'));
});

test('toHaveLink', async ({ app }) => {
    await expect(app.link).toHaveLink(expect.stringContaining('frame.html'));
});

// Checkbox — toBeChecked and toBeSelected both delegate to isSelected()
test('toBeChecked', async ({ app }) => {
    await expect(app.checkbox).toBeChecked();
});

test('not.toBeChecked', async ({ app }) => {
    await expect(app.unchecked).not.toBeChecked();
});

test('toBeSelected', async ({ app }) => {
    await expect(app.checkbox).toBeSelected();
});

// Size matchers — sizedBox has explicit width:100px height:50px
test('toHaveWidth', async ({ app }) => {
    await expect(app.sizedBox).toHaveWidth(100);
});

test('toHaveHeight', async ({ app }) => {
    await expect(app.sizedBox).toHaveHeight(50);
});

test('toHaveSize', async ({ app }) => {
    await expect(app.sizedBox).toHaveSize({ width: 100, height: 50 });
});

// CSS property — textInput has background-color: cadetblue (#5f9ea0)
test('getCSSProperty', async ({ app }) => {
    const bgColor = await app.simpleTextInput.getCSSProperty('background-color');
    expect(bgColor.parsed?.hex).toBe('#5f9ea0');
});
