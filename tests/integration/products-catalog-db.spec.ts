import { ProductsClient } from "../../api/clients/products.client";
import {
  findCatalogProducts,
  type CatalogFilters,
} from "../../db/queries/catalog.queries";
import { test, expect } from "../../fixtures/test.fixture";
import { productsResponseSchema } from "../../schemas/product.schema";

async function getCatalogPage(
  client: ProductsClient,
  filters: CatalogFilters,
  page: number,
) {
  const response = await client.getProducts({
    ...filters,
    isRental: false,
    sort: {
      field: "name",
      direction: "asc",
    },
    page,
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain(
    "application/json",
  );

  return productsResponseSchema.parse(await response.json());
}

const filterNames = ["brand", "category"] as const;

for (const filterName of filterNames) {
  test(`@integration product ${filterName} filter matches database across all pages`, async ({
    request,
    db,
  }) => {
    const productsClient = new ProductsClient(request);

    // Select reference data independently of the API.
    const allProducts = await findCatalogProducts(db);
    const referenceProduct = allProducts[0];

    if (!referenceProduct) {
      throw new Error(
        "Seed catalog must contain non-rental products",
      );
    }

    const filters: CatalogFilters =
      filterName === "brand"
        ? { brandId: referenceProduct.brand_id }
        : { categoryId: referenceProduct.category_id };

    const expectedProducts = await findCatalogProducts(db, filters);

    expect(expectedProducts.length).toBeGreaterThan(0);

    // Ensure that ignoring the filter would actually change the result.
    expect(
      expectedProducts.length,
      "Seed catalog must contain products outside the selected filter",
    ).toBeLessThan(allProducts.length);

    const firstPage = await getCatalogPage(
      productsClient,
      filters,
      1,
    );

    // Derive the expected number of pages from the database count.
    const expectedPageCount = Math.ceil(
      expectedProducts.length / firstPage.per_page,
    );

    expect(firstPage.total).toBe(expectedProducts.length);
    expect(firstPage.last_page).toBe(expectedPageCount);

    const actualIds: string[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= expectedPageCount;
      pageNumber++
    ) {
      const catalog =
        pageNumber === 1
          ? firstPage
          : await getCatalogPage(
              productsClient,
              filters,
              pageNumber,
            );

      expect(catalog.current_page).toBe(pageNumber);
      expect(catalog.total).toBe(expectedProducts.length);
      expect(catalog.per_page).toBe(firstPage.per_page);
      expect(catalog.last_page).toBe(expectedPageCount);

      const remainingProducts =
        expectedProducts.length -
        (pageNumber - 1) * firstPage.per_page;

      expect(catalog.data).toHaveLength(
        Math.min(firstPage.per_page, remainingProducts),
      );

      actualIds.push(
        ...catalog.data.map((product) => product.id),
      );
    }

    expect(
      new Set(actualIds).size,
      "API must not return duplicate product IDs",
    ).toBe(actualIds.length);

    const expectedIds = expectedProducts.map(
      (product) => product.id,
    );

    // Compare membership without depending on presentation order.
    expect([...actualIds].sort()).toEqual(
      [...expectedIds].sort(),
    );
  });
}