import { test, expect } from '../src';

test.beforeEach(async ({ driver }) => {
  await driver.url('https://www.saucedemo.com/');
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

test('get url', async ({ driver }) => {
  const url = await driver.getUrl();
  expect(url).toContain('saucedemo');
});

test('get title', async ({ driver }) => {
  const title = await driver.getTitle();
  expect(title).toContain('Swag Labs');
});

//
// Browser-level
//
test('refresh and back/forward navigation', async ({ driver, $ }) => {
  const username = $('#user-name');
  await username.addValue('standard_user');
  const password = $('#password');
  await password.addValue('secret_sauce');
  const loginButton = $('#login-button');
  await loginButton.click();
  await expect(driver).toHaveUrl(expect.stringContaining('inventory'));
  await driver.refresh();
  await expect(driver).toHaveUrl(expect.stringContaining('inventory'));
  await driver.back();
  await expect(driver).toHaveUrl('https://www.saucedemo.com/');
  await driver.forward();
  await expect(driver).toHaveUrl(expect.stringContaining('inventory'));
});

test('screenshot page', async ({ driver }) => {
  const base64 = await driver.takeScreenshot();
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
