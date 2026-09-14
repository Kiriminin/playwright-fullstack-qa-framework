import {
  test,
  expect,
  type APIResponse,
} from "@playwright/test";
import { ProductsClient } from "../../api/clients/products.client";
import { productsResponseSchema } from "../../schemas/product.schema";

async function parseCatalogResponse(response: APIResponse) {
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain(
    "application/json",
  );

  return productsResponseSchema.parse(await response.json());
}

const sortDirections = ["asc", "desc"] as const;

for (const direction of sortDirections) {
  test(`@api products are sorted by price ${direction}`, async ({
    request,
  }) => {
    const productsClient = new ProductsClient(request);

    const response = await productsClient.getProducts({
      sort: {
        field: "price",
        direction,
      },
    });

    const catalog = await parseCatalogResponse(response);
    const actualPrices = catalog.data.map((product) => product.price);

    expect(actualPrices.length).toBeGreaterThan(1);

    const expectedPrices = [...actualPrices].sort((first, second) =>
      direction === "asc" ? first - second : second - first,
    );

    expect(actualPrices).toEqual(expectedPrices);
  });
}

test("@api products can be filtered by brand", async ({ request }) => {
  const productsClient = new ProductsClient(request);

  const initialCatalog = await parseCatalogResponse(
    await productsClient.getProducts(),
  );

  const brandId = initialCatalog.data[0]?.brand.id;

  expect(brandId).toBeDefined();

  if (!brandId) {
    throw new Error("Could not select a brand from the product catalog");
  }

  const filteredCatalog = await parseCatalogResponse(
    await productsClient.getProducts({ brandId }),
  );

  expect(filteredCatalog.data.length).toBeGreaterThan(0);

  for (const product of filteredCatalog.data) {
    expect(product.brand.id).toBe(brandId);
  }
});

test("@api products can be filtered by category", async ({
  request,
}) => {
  const productsClient = new ProductsClient(request);

  const initialCatalog = await parseCatalogResponse(
    await productsClient.getProducts(),
  );

  const categoryId = initialCatalog.data[0]?.category.id;

  expect(categoryId).toBeDefined();

  if (!categoryId) {
    throw new Error(
      "Could not select a category from the product catalog",
    );
  }

  const filteredCatalog = await parseCatalogResponse(
    await productsClient.getProducts({ categoryId }),
  );

  expect(filteredCatalog.data.length).toBeGreaterThan(0);

  for (const product of filteredCatalog.data) {
    expect(product.category.id).toBe(categoryId);
  }
});

test("@api products can be filtered by price range", async ({
  request,
}) => {
  const productsClient = new ProductsClient(request);

  const initialCatalog = await parseCatalogResponse(
    await productsClient.getProducts(),
  );

  const targetProduct = initialCatalog.data[0];

  expect(targetProduct).toBeDefined();

  if (!targetProduct) {
    throw new Error("Product catalog is empty");
  }

  const minimumPrice = Math.max(0, targetProduct.price - 1);
  const maximumPrice = targetProduct.price + 1;

  const filteredCatalog = await parseCatalogResponse(
    await productsClient.getProducts({
      priceRange: {
        min: minimumPrice,
        max: maximumPrice,
      },
    }),
  );

  expect(filteredCatalog.data.length).toBeGreaterThan(0);

  for (const product of filteredCatalog.data) {
    expect(product.price).toBeGreaterThanOrEqual(minimumPrice);
    expect(product.price).toBeLessThanOrEqual(maximumPrice);
  }
});

test("@api products catalog supports pagination", async ({
  request,
}) => {
  const productsClient = new ProductsClient(request);

  const firstPage = await parseCatalogResponse(
    await productsClient.getProducts({ page: 1 }),
  );

  expect(firstPage.current_page).toBe(1);
  expect(firstPage.last_page).toBeGreaterThan(1);
  expect(firstPage.data.length).toBeGreaterThan(0);

  const secondPage = await parseCatalogResponse(
    await productsClient.getProducts({ page: 2 }),
  );

  expect(secondPage.current_page).toBe(2);
  expect(secondPage.data.length).toBeGreaterThan(0);
  expect(secondPage.total).toBe(firstPage.total);

  const firstPageIds = firstPage.data.map((product) => product.id);
  const secondPageIds = secondPage.data.map((product) => product.id);

  for (const productId of secondPageIds) {
    expect(firstPageIds).not.toContain(productId);
  }
});