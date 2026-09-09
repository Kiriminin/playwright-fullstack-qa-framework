import { type Locator, type Page } from "@playwright/test";
import { env } from "../config/env";

export class LoginPage {
  private readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("Your email");
    this.passwordInput = page.getByPlaceholder("Your password");
    this.loginButton = page.getByRole("button", {
      name: "Login",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await this.page.goto(`${env.UI_BASE_URL}/auth/login`);
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}