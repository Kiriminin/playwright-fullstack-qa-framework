import { ProductsClient } from "../../api/clients/products.client";
import {
  findCartById,
  findCartItems,
} from "../../db/queries/cart.queries";
import { test, expect } from "../../fixtures/cart.fixture";
import { CartPage } from "../../pages/cart.page";
import { cartResponseSchema } from "../../schemas/cart.schema";
import {
  productsResponseSchema,
  type Product,
} from "../../schemas/product.schema";

async function findProductWithoutDiscounts(
  client: ProductsClient,
): Promise<Product> {
  let lastPage = 1;

  for (let pageNumber = 1; pageNumber <= lastPage; pageNumber++) {
    const response = await client.getProducts({
      isRental: false,
      page: pageNumber,
      sort: { field: "name", direction: "asc" },
    });

    expect(response.status()).toBe(200);

    const catalog = productsResponseSchema.parse(await response.json());

    if (pageNumber === 1) {
      lastPage = catalog.last_page;
    }

    const product = catalog.data.find(
      (candidate) =>
        candidate.in_stock &&
        !candidate.is_rental &&
        !candidate.is_location_offer &&
        !["A", "B"].includes(candidate.co2_rating.toUpperCase()) &&
        candidate.name !== "Thor Hammer",
    );

    if (product) {
      return product;
    }
  }

  throw new Error("The catalog has no available regular product without discounts");
}

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

test("@integration cart totals and UI changes match database state", async ({
  page,
  request,
  cartClient,
  cartId,
  db,
}) => {
  const product = await findProductWithoutDiscounts(
    new ProductsClient(request),
  );
  const unitPriceCents = Math.round(product.price * 100);
  const cartPage = new CartPage(page);

  await test.step("Prepare a cart with two units through the API", async () => {
    const response = await cartClient.addItem(cartId, {
      product_id: product.id,
      quantity: 2,
    });

    expect(response.status()).toBe(200);
  });

  const cartResponse = await cartClient.getCart(cartId);

  expect(cartResponse.status()).toBe(200);

  const apiCart = cartResponseSchema.parse(await cartResponse.json());

  expect(apiCart.id).toBe(cartId);
  expect(apiCart.cart_items).toHaveLength(1);
  expect(apiCart.cart_items[0]).toMatchObject({
    cart_id: cartId,
    product_id: product.id,
    quantity: 2,
  });

  const cartItemId = apiCart.cart_items[0].id;

  await test.step("The UI displays the prepared quantity, price and total", async () => {
    await cartPage.open(cartId);

    await expect(cartPage.productRows).toHaveCount(1);
    await expect(cartPage.quantityInput(product.name)).toHaveValue("2");
    await expect(cartPage.unitPrice(product.name)).toHaveText(
      formatUsd(unitPriceCents),
    );
    await expect(cartPage.lineTotal(product.name)).toHaveText(
      formatUsd(unitPriceCents * 2),
    );
    await expect(cartPage.total).toHaveText(formatUsd(unitPriceCents * 2));
  });

  await test.step("Changing quantity through the UI updates totals and the database", async () => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (result) =>
          result.request().method() === "PUT" &&
          new URL(result.url()).pathname ===
            `/carts/${cartId}/product/quantity`,
      ),
      cartPage.updateQuantity(product.name, 3),
    ]);

    expect(response.status()).toBe(200);

    await expect(cartPage.quantityInput(product.name)).toHaveValue("3");
    await expect(cartPage.lineTotal(product.name)).toHaveText(
      formatUsd(unitPriceCents * 3),
    );
    await expect(cartPage.total).toHaveText(formatUsd(unitPriceCents * 3));

    const dbItems = await findCartItems(db, cartId);

    expect(dbItems).toEqual([
      {
        id: cartItemId,
        cart_id: cartId,
        product_id: product.id,
        quantity: 3,
      },
    ]);
  });

  await test.step("Reloading the page preserves the updated quantity and total", async () => {
    await page.reload();

    await expect(cartPage.productRows).toHaveCount(1);
    await expect(cartPage.quantityInput(product.name)).toHaveValue("3");
    await expect(cartPage.total).toHaveText(formatUsd(unitPriceCents * 3));
  });

  await test.step("Removing the product through the UI empties the cart in the database", async () => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (result) =>
          result.request().method() === "DELETE" &&
          new URL(result.url()).pathname ===
            `/carts/${cartId}/product/${product.id}`,
      ),
      cartPage.removeProduct(product.name),
    ]);

    expect(response.status()).toBe(204);

    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.productRows).toHaveCount(0);

    expect(await findCartById(db, cartId)).toEqual({ id: cartId });
    expect(await findCartItems(db, cartId)).toEqual([]);

    const responseAfterRemoval = await cartClient.getCart(cartId);

    expect(responseAfterRemoval.status()).toBe(200);

    const emptyCart = cartResponseSchema.parse(
      await responseAfterRemoval.json(),
    );

    expect(emptyCart.id).toBe(cartId);
    expect(emptyCart.cart_items).toHaveLength(0);
  });
});