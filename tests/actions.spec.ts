import { test, expect } from './fixture';
import { resolve } from 'node:path';

test.beforeEach(async ({driver}) => {
    await driver.url(`file:///${resolve(__dirname, './apps/actions.html')}`);
});

test('click', async ({app}) => {
    await app.button.click();
    await expect(app.action).toHaveText('click');
});

test('addValue', async ({app}) => {
    await app.input.addValue('someText');
    await expect(app.action).toHaveText('someText');
});

test('getUrl', async ({driver}) => {
    const url = await driver.getUrl();
    expect(url).toContain('actions');
});

test('getTitle', async ({driver}) => {
    const title = await driver.getTitle();
    expect(title).toContain('Actions');
});

//
// Browser-level
//
test('refresh/back/forward', async ({driver}) => {
    await expect(driver).toHaveUrl(expect.stringContaining('actions'));
    await driver.refresh();
    await expect(driver).toHaveUrl(expect.stringContaining('actions'));
    await driver.url(`file:///${resolve(__dirname, './apps/frame.html')}`);
    await expect(driver).toHaveUrl(expect.stringContaining('frame'));
    await driver.back();
    await expect(driver).toHaveUrl(expect.stringContaining('actions'));
    await driver.forward();
    await expect(driver).toHaveUrl(expect.stringContaining('frame'));
});

test('takeScreenshot', async ({driver}) => {
    const base64 = await driver.takeScreenshot();
    expect(typeof base64).toEqual('string');
});

test('getText', async ({app}) => {
    expect(await app.button.getText()).toContain('Click Me!');
});

test('getAttribute', async ({app}) => {
    expect(await app.button.getAttribute('id')).toBe('button');
});

test('isDisplayed', async ({app}) => {
    expect(await app.button.isDisplayed()).toBe(true);
});

test('isEnabled', async ({app}) => {
    expect(await app.button.isEnabled()).toBe(true);
});

test('isExisting', async ({app}) => {
    expect(await app.button.isExisting()).toBe(true);
    expect(await app.loadingInput.isExisting()).toBe(false);
});

test('action', async ({app, driver}) => {
    await app.input.click();
    await driver.action('key')
        .down('t')
        .up('t')
        .down('e')
        .up('e')
        .down('s')
        .up('s')
        .down('t')
        .up('t')
        .perform();
    expect(await app.input.getValue()).toEqual('test');
});

test.skip('addInitScript', async ({ driver }) => {
    await driver.addInitScript(() => {
        window.document.title = 'test'
    });
    await driver.url(`file:///${resolve(__dirname, './apps/actions.html')}`);
    await driver.pause(5000);
    expect(await driver.execute(() => window.document.title)).toEqual('test');
});

test('execute', async ({ driver }) => {
    expect(await driver.execute(() => window.document.title)).toEqual('Actions');
});

test('keys', async ({ app, driver }) => {
    await app.input.click();
    await driver.keys('test')
    await expect(app.action).toHaveText('test');
});

test('newWindow', async ({ driver }) => {
    await driver.newWindow('about:blank', {
        type:'tab',
        windowName: 'Test',
    });
    const handles = await driver.getWindowHandles();
    expect(handles.length).toBe(2);
});

test('scroll', async ({ driver, app }) => {
    await driver.scroll(0, 500);
    expect(await app.keyboardEventHandler.isDisplayed({ withinViewport: true })).toBe(true);
});

test('switchFrame', async ({ driver, app }) => {
    await driver.switchFrame('frame.html');
    await expect(app.frameElement).toBeVisible();
});