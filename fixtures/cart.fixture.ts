import { CartClient } from "../api/clients/cart.client";
import { ProductsClient } from "../api/clients/products.client";
import { cartCreatedSchema } from "../schemas/cart.schema";
import {
  productsResponseSchema,
  type Product,
} from "../schemas/product.schema";
import { test as base, expect } from "./test.fixture";

type CartFixtures = {
  cartClient: CartClient;
  cartId: string;
  cartProducts: [Product, Product];
};

export const test = base.extend<CartFixtures>({
  cartClient: async ({ request }, use) => {
    await use(new CartClient(request));
  },

  cartId: async ({ cartClient }, use) => {
    let createdCartId: string | undefined;

    try {
      const response = await cartClient.createCart();
      const parsed = cartCreatedSchema.safeParse(await response.json());

      if (parsed.success) {
        createdCartId = parsed.data.id;
      }

      expect(response.status()).toBe(201);
      expect(response.headers()["content-type"]).toContain("application/json");

      if (!parsed.success) {
        throw parsed.error;
      }

      await use(parsed.data.id);
    } finally {
      if (createdCartId) {
        const response = await cartClient.deleteCart(createdCartId);

        expect(
          response.status(),
          `Failed to clean up test cart ${createdCartId}`,
        ).toBe(204);
      }
    }
  },

  cartProducts: async ({ request }, use) => {
    const productsClient = new ProductsClient(request);
    const response = await productsClient.getProducts({
      isRental: false,
      sort: { field: "name", direction: "asc" },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const catalog = productsResponseSchema.parse(await response.json());
    const eligibleProducts = catalog.data.filter(
      (product) =>
        product.in_stock &&
        !product.is_rental &&
        !product.is_location_offer &&
        product.name !== "Thor Hammer",
    );

    const firstProduct = eligibleProducts[0];
    const secondProduct = eligibleProducts.find(
      (product) => product.id !== firstProduct?.id,
    );

    if (!firstProduct || !secondProduct) {
      throw new Error(
        "Cart tests require two different available regular products on the first catalog page",
      );
    }

    await use([firstProduct, secondProduct]);
  },
});

export { expect };