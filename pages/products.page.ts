import type { Locator, Page } from "@playwright/test";
import { env } from "../config/env";

export type PriceSortDirection = "asc" | "desc";

export class ProductsPage {
  private readonly page: Page;
  private readonly sortingCompleted: Locator;

  readonly sortSelect: Locator;
  readonly productCards: Locator;
  readonly productPrices: Locator;

  constructor(page: Page) {
    this.page = page;

    this.sortSelect = page.getByRole("combobox", {
      name: "sort",
      exact: true,
    });

    this.productCards = page.locator(
      'a[data-test^="product-"]',
    );

    this.productPrices = this.productCards.locator(
      '[data-test="product-price"]',
    );

    this.sortingCompleted = page.locator(
      '[data-test="sorting_completed"]',
    );
  }

  async open(): Promise<void> {
    await this.page.goto(env.UI_BASE_URL);

    await this.productCards.first().waitFor({
      state: "visible",
    });
  }

  async sortByPrice(
    direction: PriceSortDirection,
  ): Promise<void> {
    await this.sortSelect.selectOption(`price,${direction}`);

    await this.sortingCompleted.waitFor({
      state: "visible",
    });
  }

  async getDisplayedPrices(): Promise<number[]> {
    const priceTexts = await this.productPrices.allTextContents();

    return priceTexts.map((text) => {
      const normalizedText = text.trim();
      const match = /^\$(\d+\.\d{2})$/.exec(normalizedText);

      if (!match) {
        throw new Error(
          `Unexpected product price format: "${normalizedText}"`,
        );
      }

      return Number(match[1]);
    });
  }
}