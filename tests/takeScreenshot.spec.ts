import { test, expect } from './fixture';
import { resolve } from 'node:path';

test.beforeEach(async ({ driver }) => {
    await driver.url(`file:///${resolve(__dirname, './apps/actions.html')}`);
});

test('takeScreenshot across a multi-step flow', async ({ app, driver }) => {
    await driver.setWindowSize(400, 1200);
    await driver.takeScreenshot();
    await expect(app.input).toExist();
    await app.input.addValue('someText');
    await expect(app.action).toHaveText('someText');
    await driver.takeScreenshot();
    await app.button.click();
    await expect(app.action).toHaveText('click');
    await driver.takeScreenshot();
});
