import { test, expect } from "@playwright/test";
import { env } from "../../config/env";
import { productsResponseSchema } from "../../schemas/product.schema";

test("@smoke GET /products returns a valid product catalog", async ({
  request,
}) => {
  const response = await request.get(`${env.API_BASE_URL}/products`);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const responseBody = await response.json();
  const productsResponse = productsResponseSchema.parse(responseBody);

  expect(productsResponse.data.length).toBeGreaterThan(0);
  expect(productsResponse.total).toBeGreaterThan(0);
});