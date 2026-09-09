import type { APIRequestContext, APIResponse } from "@playwright/test";
import { env } from "../../config/env";

export class ProductsClient {
  constructor(private readonly request: APIRequestContext) {}

  async getProducts(): Promise<APIResponse> {
    return this.request.get(`${env.API_BASE_URL}/products`);
  }
}