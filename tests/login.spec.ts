import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Tests for the Facebook login page UI.
 * None of these tests submit the login form, so no credentials are needed and
 * Facebook does not see failed login attempts.
 */
test.describe('Facebook login page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });


// UI Tests
  test.describe('UI', () => {
    test('TC01: renders the main elements', async () => {
      await loginPage.expectOnLoginPage();
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.forgotPasswordLink).toBeVisible();
      await expect(loginPage.createAccountButton).toBeVisible();
    });

    test('TC02: email and password fields are empty by default', async () => {
      await expect(loginPage.emailInput).toBeEmpty();
      await expect(loginPage.passwordInput).toBeEmpty();
    });

    test('TC03: password field masks the input', async () => {
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('TC04: login button is enabled', async () => {
      await expect(loginPage.loginButton).toBeEnabled();
    });
  });


  // Input Tests
  test.describe('Input', () => {
    test('TC05: email field accepts text', async () => {
      await loginPage.emailInput.fill('test@example.com');
      await expect(loginPage.emailInput).toHaveValue('test@example.com');
    });

    test('TC06: password field accepts text', async () => {
      await loginPage.passwordInput.fill('SomePassword123');
      await expect(loginPage.passwordInput).toHaveValue('SomePassword123');
    });

    test('TC07: Tab moves focus from email to password', async ({ page }) => {
      await loginPage.emailInput.focus();
      await page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();
    });

    test('TC08: fields can be cleared', async () => {
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.emailInput.clear();
      await expect(loginPage.emailInput).toBeEmpty();
    });
  });


  // Navigation Tests
  test.describe('Navigation', () => {
    test('TC09: "Quên mật khẩu?" opens the account recovery page', async ({ page }) => {
      await loginPage.clickForgotPassword();
      await expect(page).toHaveURL(/recover|identify/i);
    });

    test('TC10: "Tạo tài khoản mới" starts account creation', async ({ page }) => {
      await loginPage.clickCreateAccount();
      // Facebook either opens a sign-up dialog or navigates to a sign-up page
      await expect
        .poll(
          async () =>
            /r\.php|signup|reg/i.test(page.url()) ||
            (await page.getByText('Đăng ký').first().isVisible()),
          { timeout: 10_000 },
        )
        .toBe(true);
    });
  });
});