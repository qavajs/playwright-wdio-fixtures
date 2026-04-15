import { test, expect } from './fixture';
import { resolve } from 'node:path';

test.beforeEach(async ({ driver }) => {
    await driver.url(`file:///${resolve(__dirname, './apps/dragdrop.html')}`);
});

test('dragAndDrop', async ({ app }) => {
    await app.dragElement.dragAndDrop(app.dropZone);
    await expect(app.dragElementInDropZone).toExist();
});
