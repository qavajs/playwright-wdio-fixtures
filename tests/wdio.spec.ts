import { test, expect } from '../src';

test.beforeEach(async ({ wdioBrowser }) => {
  await wdioBrowser.url('https://www.saucedemo.com/');
});

test('click and type', async ({ $ }) => {
  const username = $('#user-name');
  await username.addValue('standard_user');
  const password = $('#password');
  await password.addValue('secret_sauce');
  const loginButton = $('#login-button');
  await loginButton.click();
  await expect(username).toBeHidden();
})

test('get url', async ({ wdioBrowser }) => {
  const url = await wdioBrowser.getUrl();
  expect(url).toContain('saucedemo');
});

test('get title', async ({ wdioBrowser }) => {
  const url = await wdioBrowser.getTitle();
  expect(url).toContain('Swag Labs');
});