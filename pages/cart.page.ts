import type { Locator, Page } from "@playwright/test";
import { env } from "../config/env";

export class CartPage {
  private readonly root: Locator;

  readonly productRows: Locator;
  readonly total: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator("app-cart");

    this.productRows = this.root.locator("tbody tr").filter({
      has: page.locator('[data-test="product-title"]'),
    });

    this.total = this.root.locator('[data-test="cart-total"]');

    this.emptyMessage = this.root.getByText(
      "The cart is empty. Nothing to display.",
      { exact: true },
    );
  }

  async open(cartId: string): Promise<void> {
    const uiOrigin = new URL(env.UI_BASE_URL).origin;

    await this.page.addInitScript(
      ({ origin, id }) => {
        if (window.location.origin === origin) {
          window.sessionStorage.setItem("cart_id", id);
          window.localStorage.setItem("language", "en");
        }
      },
      { origin: uiOrigin, id: cartId },
    );

    await this.page.goto(new URL("/checkout", env.UI_BASE_URL).href);
  }

  quantityInput(productName: string): Locator {
    return this.root.getByLabel(`Quantity for ${productName}`, {
      exact: true,
    });
  }

  unitPrice(productName: string): Locator {
    return this.productRow(productName).locator('[data-test="product-price"]');
  }

  lineTotal(productName: string): Locator {
    return this.productRow(productName).locator('[data-test="line-price"]');
  }

  async updateQuantity(productName: string, quantity: number): Promise<void> {
    const input = this.quantityInput(productName);

    await input.fill(String(quantity));
    await input.press("Tab");
  }

  async removeProduct(productName: string): Promise<void> {
    await this.productRow(productName).locator("a.btn-danger").click();
  }

  private productRow(productName: string): Locator {
    return this.productRows.filter({
      has: this.page.getByLabel(`Quantity for ${productName}`, {
        exact: true,
      }),
    });
  }
}