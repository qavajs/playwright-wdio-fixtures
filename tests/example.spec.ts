import { test, expect } from '../core';

test('has url', async ({ wdioBrowser }) => {
  await wdioBrowser.url('https://www.saucedemo.com/');
  await test.step('fill form', async () => {
    const username = wdioBrowser.$('body').$('#user-name');
    await username.addValue('standard_user');
    const password = wdioBrowser.$('#password');
    await password.addValue('secret_sauce');
    const loginButton = wdioBrowser.$('#login-button');
    await loginButton.click();
  });
  await test.step('verify that logo is visible', async () => {
    await wdioBrowser.$('.app_logo').waitForDisplayed();
  });
  expect(await wdioBrowser.getUrl()).toMatch(/saucedemo/);
});