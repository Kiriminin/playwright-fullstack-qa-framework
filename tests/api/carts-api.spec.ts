import type { CartClient } from "../../api/clients/cart.client";
import { test, expect } from "../../fixtures/cart.fixture";
import {
  cartResponseSchema,
  type Cart,
} from "../../schemas/cart.schema";

async function readCart(client: CartClient, cartId: string): Promise<Cart> {
  const response = await client.getCart(cartId);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const cart = cartResponseSchema.parse(await response.json());
  expect(cart.id).toBe(cartId);

  return cart;
}

test("@api new cart is empty", async ({ cartClient, cartId }) => {
  const cart = await readCart(cartClient, cartId);

  expect(cart.cart_items).toHaveLength(0);
});

test("@api adding a product stores its quantity and price", async ({
  cartClient,
  cartId,
  cartProducts,
}) => {
  const [product] = cartProducts;
  const response = await cartClient.addItem(cartId, {
    product_id: product.id,
    quantity: 2,
  });

  expect(response.status()).toBe(200);

  const cart = await readCart(cartClient, cartId);

  expect(cart.cart_items).toHaveLength(1);
  expect(cart.cart_items[0]).toMatchObject({
    cart_id: cartId,
    product_id: product.id,
    quantity: 2,
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
    },
  });
});

test("@api adding the same product increases quantity without duplicate rows", async ({
  cartClient,
  cartId,
  cartProducts,
}) => {
  const [product] = cartProducts;
  const firstResponse = await cartClient.addItem(cartId, {
    product_id: product.id,
    quantity: 2,
  });

  expect(firstResponse.status()).toBe(200);

  const before = await readCart(cartClient, cartId);

  expect(before.cart_items).toHaveLength(1);
  expect(before.cart_items[0].quantity).toBe(2);

  const secondResponse = await cartClient.addItem(cartId, {
    product_id: product.id,
    quantity: 3,
  });

  expect(secondResponse.status()).toBe(200);

  const after = await readCart(cartClient, cartId);

  expect(after.cart_items).toHaveLength(1);
  expect(after.cart_items[0]).toMatchObject({
    id: before.cart_items[0].id,
    cart_id: cartId,
    product_id: product.id,
    quantity: 5,
  });
});

for (const quantity of [5, 1]) {
  test(`@api updating quantity replaces 2 with ${quantity}`, async ({
    cartClient,
    cartId,
    cartProducts,
  }) => {
    const [product] = cartProducts;
    const addResponse = await cartClient.addItem(cartId, {
      product_id: product.id,
      quantity: 2,
    });

    expect(addResponse.status()).toBe(200);

    const before = await readCart(cartClient, cartId);

    expect(before.cart_items).toHaveLength(1);
    expect(before.cart_items[0].quantity).toBe(2);

    const updateResponse = await cartClient.updateQuantity(cartId, {
      product_id: product.id,
      quantity,
    });

    expect(updateResponse.status()).toBe(200);

    const after = await readCart(cartClient, cartId);

    expect(after.cart_items).toHaveLength(1);
    expect(after.cart_items[0]).toMatchObject({
      id: before.cart_items[0].id,
      cart_id: cartId,
      product_id: product.id,
      quantity,
    });
  });
}

test("@api removing products preserves other items and can empty the cart", async ({
  cartClient,
  cartId,
  cartProducts,
}) => {
  const [firstProduct, secondProduct] = cartProducts;

  for (const product of cartProducts) {
    const response = await cartClient.addItem(cartId, {
      product_id: product.id,
      quantity: 2,
    });

    expect(response.status()).toBe(200);
  }

  const before = await readCart(cartClient, cartId);

  expect(before.cart_items).toHaveLength(2);
  expect(
    before.cart_items.map((item) => item.product_id).sort(),
  ).toEqual([firstProduct.id, secondProduct.id].sort());

  const firstRemoval = await cartClient.removeItem(cartId, firstProduct.id);

  expect(firstRemoval.status()).toBe(204);

  const afterFirstRemoval = await readCart(cartClient, cartId);

  expect(afterFirstRemoval.cart_items).toHaveLength(1);
  expect(afterFirstRemoval.cart_items[0]).toMatchObject({
    cart_id: cartId,
    product_id: secondProduct.id,
    quantity: 2,
  });

  const secondRemoval = await cartClient.removeItem(cartId, secondProduct.id);

  expect(secondRemoval.status()).toBe(204);

  const emptyCart = await readCart(cartClient, cartId);

  expect(emptyCart.cart_items).toHaveLength(0);
});