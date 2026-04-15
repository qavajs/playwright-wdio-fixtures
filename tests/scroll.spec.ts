import { test, expect } from './fixture';
import { resolve } from 'node:path';

test.beforeEach(async ({ driver }) => {
    await driver.url(`file:///${resolve(__dirname, './apps/scroll.html')}`);
});

test('scrollIntoView', async ({ app }) => {
    await app.scrollElement.scrollIntoView();
    expect(await app.scrollElement.isDisplayed({ withinViewport: true })).toBe(true);
});

test('getSize', async ({ app }) => {
    const size = await app.scrollElement.getSize();
    expect(typeof size.width).toBe('number');
    expect(typeof size.height).toBe('number');
});

test('getLocation', async ({ app }) => {
    const location = await app.scrollElement.getLocation();
    expect(location.x).toBeGreaterThan(0);
    expect(location.y).toBeGreaterThan(0);
});
