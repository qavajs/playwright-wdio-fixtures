import { test, expect } from '../src';

test.beforeEach(async ({ driver }) => {
    await driver.url('https://www.saucedemo.com/');
});

test('toExist', async ({ $, driver }) => {
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

test('toBeVisible', async ({ $ }) => {
    await expect($('#user-name')).toBeVisible();
});

test('toBeEnabled', async ({ $ }) => {
    await expect($('#login-button')).toBeEnabled();
});

test('toBeDisabled', async ({ $ }) => {
    await expect($('#login-button')).not.toBeDisabled();
});

test('toBeFocused', async ({ $, driver }) => {
    const username = $('#user-name');
    await username.click();
    await expect(username).toBeFocused();
});

test('toHaveText', async ({ $ }) => {
    await expect($('#login_credentials h4')).toHaveText(expect.stringMatching(/Accepted usernames/i));
});

test('toHaveValue', async ({ $ }) => {
    const username = $('#user-name');
    await username.setValue('standard_user');
    await expect(username).toHaveValue('standard_user');
});

test('toHaveAttribute', async ({ $ }) => {
    await expect($('#login-button')).toHaveAttribute('type', 'submit');
});

test('toHaveElementClass', async ({ $ }) => {
    await expect($('#login-button')).toHaveElementClass('submit-button');
});

test('toHaveId', async ({ $ }) => {
    await expect($('#user-name')).toHaveId('user-name');
});

test('toHaveProperty', async ({ $ }) => {
    await expect($('#user-name')).toHaveElementProperty('tagName', 'INPUT');
});

test('toHaveUrl', async ({ driver }) => {
    await expect(driver).toHaveUrl('https://www.saucedemo.com/');
});

test('toHaveUrlContaining', async ({ driver }) => {
    await expect(driver).toHaveUrl(expect.stringContaining('saucedemo'));
});

test('toHaveTitle', async ({ driver }) => {
    await expect(driver).toHaveTitle('Swag Labs');
});

test('toHaveTitleContaining', async ({ driver }) => {
    await expect(driver).toHaveTitle(expect.stringContaining('Swag'));
});
