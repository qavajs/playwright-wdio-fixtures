import { expect, test } from '../src';

test.skip('takeScreenshot', async ({ $, driver }) => {
    await driver.url('https://www.saucedemo.com/');
    await driver.takeScreenshot();
    await expect($('#user-name')).toExist();

    const username = $('#user-name');
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