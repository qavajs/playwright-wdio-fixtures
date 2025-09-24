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
});

test('get url', async ({ wdioBrowser }) => {
  const url = await wdioBrowser.getUrl();
  expect(url).toContain('saucedemo');
});

test('get title', async ({ wdioBrowser }) => {
  const title = await wdioBrowser.getTitle();
  expect(title).toContain('Swag Labs');
});

//
// Browser-level
//
test('refresh and back/forward navigation', async ({ wdioBrowser, $ }) => {
  const username = $('#user-name');
  await username.addValue('standard_user');
  const password = $('#password');
  await password.addValue('secret_sauce');
  const loginButton = $('#login-button');
  await loginButton.click();
  await expect(wdioBrowser).toHaveUrl(expect.stringContaining('inventory'));
  await wdioBrowser.refresh();
  await expect(wdioBrowser).toHaveUrl(expect.stringContaining('inventory'));
  await wdioBrowser.back();
  await expect(wdioBrowser).toHaveUrl('https://www.saucedemo.com/');
  await wdioBrowser.forward();
  await expect(wdioBrowser).toHaveUrl(expect.stringContaining('inventory'));
});

test('screenshot page', async ({ wdioBrowser }) => {
  const base64 = await wdioBrowser.takeScreenshot();
  expect(typeof base64).toEqual('string');
});

test('get text', async ({ $ }) => {
  const element = $('#login_credentials h4');
  expect(await element.getText()).toContain('Accepted usernames are:');
});

test('get attributes', async ({ $ }) => {
  const loginButton = $('#login-button');
  expect(await loginButton.getAttribute('type')).toBe('submit');
});

test('set value clears existing text', async ({ $ }) => {
  const username = $('#user-name');
  await username.setValue('temp_user');
  expect(await username.getValue()).toBe('temp_user');
});

test('element displayed state', async ({ $ }) => {
  const loginButton = $('#login-button');
  expect(await loginButton.isDisplayed()).toBe(true);
});

test('element enabled/disabled state', async ({ $ }) => {
  const loginButton = $('#login-button');
  expect(await loginButton.isEnabled()).toBe(true);
});

test('element existence', async ({ $ }) => {
  const username = $('#user-name');
  expect(await username.isExisting()).toBe(true);

  const fake = $('#does-not-exist');
  expect(await fake.isExisting()).toBe(false);
});
