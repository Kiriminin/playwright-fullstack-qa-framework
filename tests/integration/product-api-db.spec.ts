import { ProductsClient } from "../../api/clients/products.client";
import { findProductById } from "../../db/queries/product.queries";
import { test, expect } from "../../fixtures/test.fixture";
import { productsResponseSchema } from "../../schemas/product.schema";

test("@integration API product matches database record", async ({
  request,
  db,
}) => {
  const productsClient = new ProductsClient(request);
  const response = await productsClient.getProducts();

  expect(response.status()).toBe(200);

  const responseBody = await response.json();
  const productsResponse = productsResponseSchema.parse(responseBody);
  const apiProduct = productsResponse.data[0];

  expect(apiProduct).toBeDefined();

  if (!apiProduct) {
    throw new Error("API returned an empty product list");
  }

  const dbProduct = await findProductById(db, apiProduct.id);

  expect(dbProduct).toBeDefined();

  if (!dbProduct) {
    throw new Error(`Product ${apiProduct.id} was not found in the database`);
  }

  expect(dbProduct.id).toBe(apiProduct.id);
  expect(dbProduct.name).toBe(apiProduct.name);
  expect(dbProduct.description).toBe(apiProduct.description);
  expect(Number(dbProduct.price)).toBe(apiProduct.price);
  expect(Boolean(dbProduct.is_location_offer)).toBe(
    apiProduct.is_location_offer,
  );
  expect(Boolean(dbProduct.is_rental)).toBe(apiProduct.is_rental);
  expect((dbProduct.stock ?? 0) > 0).toBe(apiProduct.in_stock);
  expect(dbProduct.co2_rating).toBe(apiProduct.co2_rating);
});