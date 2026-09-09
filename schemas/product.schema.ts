import { z } from "zod";

const productImageSchema = z.object({
  id: z.string(),
  by_name: z.string(),
  by_url: z.string(),
  source_name: z.string(),
  source_url: z.string(),
  file_name: z.string(),
  title: z.string(),
});

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  is_location_offer: z.boolean(),
  is_rental: z.boolean(),
  co2_rating: z.string(),
  in_stock: z.boolean(),
  is_eco_friendly: z.boolean(),
  product_image: productImageSchema,
  category: categorySchema,
  brand: brandSchema,
});

export const productsResponseSchema = z.object({
  current_page: z.number().int().positive(),
  data: z.array(productSchema),
  from: z.number().int().nullable(),
  last_page: z.number().int().nonnegative(),
  per_page: z.number().int().positive(),
  to: z.number().int().nullable(),
  total: z.number().int().nonnegative(),
});

export type Product = z.infer<typeof productSchema>;