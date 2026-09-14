import type { Pool } from "mysql2/promise";
import type { CartClient } from "../../api/clients/cart.client";
import {
  findCartById,
  findCartItems,
} from "../../db/queries/cart.queries";
import { test, expect } from "../../fixtures/cart.fixture";
import { cartResponseSchema } from "../../schemas/cart.schema";

interface ExpectedCartItem {
  productId: string;
  quantity: number;
}

async function expectCartState(
  cartClient: CartClient,
  db: Pool,
  cartId: string,
  expectedItems: ExpectedCartItem[],
): Promise<void> {
  const response = await cartClient.getCart(cartId);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const apiCart = cartResponseSchema.parse(await response.json());

  expect(apiCart.id).toBe(cartId);

  const dbCart = await findCartById(db, cartId);

  expect(dbCart).toEqual({ id: cartId });

  const dbItems = await findCartItems(db, cartId);

  expect(dbItems).toHaveLength(expectedItems.length);
  expect(apiCart.cart_items).toHaveLength(expectedItems.length);

  for (const expectedItem of expectedItems) {
    const dbItem = dbItems.find(
      (item) => item.product_id === expectedItem.productId,
    );

    if (!dbItem) {
      throw new Error(
        `Product ${expectedItem.productId} is missing from cart ${cartId} in the database`,
      );
    }

    expect(dbItem).toMatchObject({
      cart_id: cartId,
      product_id: expectedItem.productId,
      quantity: expectedItem.quantity,
    });

    const apiItem = apiCart.cart_items.find(
      (item) => item.product_id === expectedItem.productId,
    );

    expect(apiItem).toMatchObject(dbItem);
  }
}

test("@integration API cart changes are persisted in database", async ({
  cartClient,
  cartId,
  cartProducts,
  db,
}) => {
  const [firstProduct, secondProduct] = cartProducts;

  const verifyCart = (items: ExpectedCartItem[]) =>
    expectCartState(cartClient, db, cartId, items);

  await test.step("A new cart exists in the database and has no items", async () => {
    await verifyCart([]);
  });

  await test.step("Adding two products creates the expected database rows", async () => {
    const firstResponse = await cartClient.addItem(cartId, {
      product_id: firstProduct.id,
      quantity: 2,
    });

    expect(firstResponse.status()).toBe(200);

    const secondResponse = await cartClient.addItem(cartId, {
      product_id: secondProduct.id,
      quantity: 1,
    });

    expect(secondResponse.status()).toBe(200);

    await verifyCart([
      { productId: firstProduct.id, quantity: 2 },
      { productId: secondProduct.id, quantity: 1 },
    ]);
  });

  await test.step("Adding the same product increases quantity without duplicate rows", async () => {
    const response = await cartClient.addItem(cartId, {
      product_id: firstProduct.id,
      quantity: 3,
    });

    expect(response.status()).toBe(200);

    await verifyCart([
      { productId: firstProduct.id, quantity: 5 },
      { productId: secondProduct.id, quantity: 1 },
    ]);
  });

  await test.step("Updating quantity replaces its stored value", async () => {
    const response = await cartClient.updateQuantity(cartId, {
      product_id: firstProduct.id,
      quantity: 1,
    });

    expect(response.status()).toBe(200);

    await verifyCart([
      { productId: firstProduct.id, quantity: 1 },
      { productId: secondProduct.id, quantity: 1 },
    ]);
  });

  await test.step("Removing one product preserves the other database row", async () => {
    const response = await cartClient.removeItem(cartId, firstProduct.id);

    expect(response.status()).toBe(204);

    await verifyCart([
      { productId: secondProduct.id, quantity: 1 },
    ]);
  });

  await test.step("Removing the last product leaves an existing empty cart", async () => {
    const response = await cartClient.removeItem(cartId, secondProduct.id);

    expect(response.status()).toBe(204);

    await verifyCart([]);
  });
});