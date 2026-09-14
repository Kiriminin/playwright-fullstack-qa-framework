import { z } from "zod";
import type { CartClient } from "../../api/clients/cart.client";
import { test, expect } from "../../fixtures/cart.fixture";
import {
  cartResponseSchema,
  type Cart,
} from "../../schemas/cart.schema";

const quantityErrorSchema = z.object({
  message: z.string().min(1),
  errors: z.object({
    quantity: z.array(z.string().min(1)).min(1),
  }),
});

const invalidQuantityCases = [
  { name: "zero", quantity: 0 },
  { name: "negative quantity", quantity: -1 },
  { name: "quantity above 99", quantity: 100 },
  { name: "fractional quantity", quantity: 1.5 },
];

async function readCart(client: CartClient, cartId: string): Promise<Cart> {
  const response = await client.getCart(cartId);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const cart = cartResponseSchema.parse(await response.json());
  expect(cart.id).toBe(cartId);

  return cart;
}

for (const operation of ["add", "update"] as const) {
  for (const invalidCase of invalidQuantityCases) {
    test(`@api @negative ${operation} rejects ${invalidCase.name} without changing the cart`, async ({
      cartClient,
      cartId,
      cartProducts,
    }) => {
      const [product] = cartProducts;

      const setupResponse = await cartClient.addItem(cartId, {
        product_id: product.id,
        quantity: 2,
      });

      expect(setupResponse.status()).toBe(200);

      const before = await readCart(cartClient, cartId);

      expect(before.cart_items).toHaveLength(1);
      expect(before.cart_items[0]).toMatchObject({
        cart_id: cartId,
        product_id: product.id,
        quantity: 2,
      });

      const invalidPayload = {
        product_id: product.id,
        quantity: invalidCase.quantity,
      };

      const response =
        operation === "add"
          ? await cartClient.addItem(cartId, invalidPayload)
          : await cartClient.updateQuantity(cartId, invalidPayload);

      expect(response.status()).toBe(422);
      expect(response.headers()["content-type"]).toContain("application/json");

      quantityErrorSchema.parse(await response.json());

      const after = await readCart(cartClient, cartId);

      expect(after).toEqual(before);
    });
  }
}