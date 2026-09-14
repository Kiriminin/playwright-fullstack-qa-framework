import { test, expect } from "@playwright/test";
import { ProductsPage } from "../../pages/products.page";

const sortDirections = ["asc", "desc"] as const;

for (const direction of sortDirections) {
  test(`@ui catalog sorts displayed prices ${direction}`, async ({
    page,
  }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.open();
    await productsPage.sortByPrice(direction);

    await expect(productsPage.sortSelect).toHaveValue(
      `price,${direction}`,
    );

    const actualPrices = await productsPage.getDisplayedPrices();

    expect(actualPrices.length).toBeGreaterThan(1);

    expect(
      new Set(actualPrices).size,
      "Test data must include different prices to verify sorting",
    ).toBeGreaterThan(1);

    const expectedPrices = [...actualPrices].sort(
      (first, second) =>
        direction === "asc"
          ? first - second
          : second - first,
    );

    expect(actualPrices).toEqual(expectedPrices);
  });
}