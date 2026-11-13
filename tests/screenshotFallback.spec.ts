import { test, expect } from './fixture';
import { resolve } from 'node:path';

// with no trace recorded, the screenshot can't be injected into the trace viewer
test.use({ trace: 'off' });

test('takeScreenshot falls back to a regular attachment', async ({ driver }) => {
    await driver.url(`file:///${resolve(__dirname, './apps/values.html')}`);
    await driver.takeScreenshot();
    const screenshot = test.info().attachments.find(a => a.name === 'screenshot');
    expect(screenshot?.contentType).toBe('image/png');
});
