import { test, expect } from '../src';

test.beforeEach(async ({ wdioBrowser }) => {
    await wdioBrowser.url('https://www.saucedemo.com/');
});

test('toExist', async ({ $, wdioBrowser, takeScreenshot }) => {

    await wdioBrowser.pause(3000);
    await takeScreenshot();

    await expect($('#user-name')).toExist();

    const username = $('#user-name');
    await username.addValue('standard_user');
    const password = $('#password');
    await password.addValue('secret_sauce');
    const loginButton = $('#login-button');
    await loginButton.click();
    await expect(username).toBeHidden();

    await takeScreenshot();
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

test('toBeFocused', async ({ $, wdioBrowser }) => {
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

test('toHaveUrl', async ({ wdioBrowser }) => {
    await expect(wdioBrowser).toHaveUrl('https://www.saucedemo.com/');
});

test('toHaveUrlContaining', async ({ wdioBrowser }) => {
    await expect(wdioBrowser).toHaveUrl(expect.stringContaining('saucedemo'));
});

test('toHaveTitle', async ({ wdioBrowser }) => {
    await expect(wdioBrowser).toHaveTitle('Swag Labs');
});

test('toHaveTitleContaining', async ({ wdioBrowser }) => {
    await expect(wdioBrowser).toHaveTitle(expect.stringContaining('Swag'));
});
