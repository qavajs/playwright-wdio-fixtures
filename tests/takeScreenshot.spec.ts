import { expect, test } from '../src';

test.skip('takeScreenshot', async ({ $, driver }) => {
    await driver.url('https://www.saucedemo.com/');
    await driver.setWindowSize(400, 1200);
    await driver.takeScreenshot();
    const username = $('#user-name');
    await expect(username).toExist();
    await username.addValue('standard_user');
    await driver.takeScreenshot();
    const password = $('#password');
    await password.addValue('secret_sauce');
    await driver.takeScreenshot();
    const loginButton = $('#login-button');
    await loginButton.click();
    await expect(username).toBeHidden();
    await driver.takeScreenshot();
});