import type { APIRequestContext, APIResponse } from "@playwright/test";

export interface CartItemPayload {
  product_id: string;
  quantity: number;
}

export class CartClient {
  private readonly headers = {
    Accept: "application/json",
  };

  constructor(private readonly request: APIRequestContext) {}

  async createCart(): Promise<APIResponse> {
    return this.request.post("/carts", {
      headers: this.headers,
      data: {},
    });
  }

  async getCart(cartId: string): Promise<APIResponse> {
    return this.request.get(`/carts/${encodeURIComponent(cartId)}`, {
      headers: this.headers,
    });
  }

  async addItem(
    cartId: string,
    item: CartItemPayload,
  ): Promise<APIResponse> {
    return this.request.post(`/carts/${encodeURIComponent(cartId)}`, {
      headers: this.headers,
      data: item,
    });
  }

  async updateQuantity(
    cartId: string,
    item: CartItemPayload,
  ): Promise<APIResponse> {
    return this.request.put(
      `/carts/${encodeURIComponent(cartId)}/product/quantity`,
      {
        headers: this.headers,
        data: item,
      },
    );
  }

  async removeItem(
    cartId: string,
    productId: string,
  ): Promise<APIResponse> {
    return this.request.delete(
      `/carts/${encodeURIComponent(cartId)}/product/${encodeURIComponent(productId)}`,
      {
        headers: this.headers,
      },
    );
  }

  async deleteCart(cartId: string): Promise<APIResponse> {
    return this.request.delete(`/carts/${encodeURIComponent(cartId)}`, {
      headers: this.headers,
    });
  }
}
