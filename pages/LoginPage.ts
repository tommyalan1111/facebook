import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the Facebook login page.
 * URL: https://www.facebook.com/?locale=vi_VN (Vietnamese UI)
 *
 * Text locators are Vietnamese. Facebook's CSS classes (x9f619, x1n2onr6, ...) are
 * auto-generated and change often, so never use them as selectors.
 */
export class LoginPage {
  static readonly PATH = '/?locale=vi_VN';

  readonly page: Page;

  // Locators
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly createAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByText('Đăng nhập vào Facebook');

    // Placeholder first; falls back to Facebook's stable name="email" / name="pass" attributes
    this.emailInput = page
      .getByPlaceholder('Email hoặc số di động')
      .or(page.locator('input[name="email"]'))
      .first();
    this.passwordInput = page
      .getByPlaceholder('Mật khẩu')
      .or(page.locator('input[name="pass"]'))
      .first();

    this.loginButton = page.getByRole('button', { name: 'Đăng nhập', exact: true });
    this.forgotPasswordLink = page.getByText('Quên mật khẩu?');
    this.createAccountButton = page.getByText('Tạo tài khoản mới');
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto(LoginPage.PATH, { waitUntil: 'domcontentloaded' });
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  // Actions
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async clickCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
  }

  // Assertions
  async expectOnLoginPage(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
  }
}