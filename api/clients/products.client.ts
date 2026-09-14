import type {
  APIRequestContext,
  APIResponse,
} from "@playwright/test";

export type ProductSortField = "name" | "price";
export type SortDirection = "asc" | "desc";

export interface GetProductsOptions {
  brandId?: string;
  categoryId?: string;
  isRental?: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
  sort?: {
    field: ProductSortField;
    direction: SortDirection;
  };
  page?: number;
}

export class ProductsClient {
  constructor(private readonly request: APIRequestContext) {}

  async getProducts(
    options: GetProductsOptions = {},
  ): Promise<APIResponse> {
    const params = new URLSearchParams();

    if (options.brandId) {
      params.set("by_brand", options.brandId);
    }

    if (options.categoryId) {
      params.set("by_category", options.categoryId);
    }

    if (options.isRental !== undefined) {
      params.set("is_rental", String(options.isRental));
    }

    if (options.priceRange) {
      params.set(
        "between",
        `price,${options.priceRange.min},${options.priceRange.max}`,
      );
    }

    if (options.sort) {
      params.set(
        "sort",
        `${options.sort.field},${options.sort.direction}`,
      );
    }

    if (options.page !== undefined) {
      params.set("page", String(options.page));
    }

    return this.request.get("/products", {
      params,
    });
  }
}