import { z } from "zod";

export const cartCreatedSchema = z.object({
  id: z.string().min(1),
});

const cartProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
});

export const cartItemSchema = z.object({
  id: z.string().min(1),
  cart_id: z.string().min(1),
  product_id: z.string().min(1),
  quantity: z.number().int().positive(),
  product: cartProductSchema,
});

export const cartResponseSchema = z.object({
  id: z.string().min(1),
  cart_items: z.array(cartItemSchema),
});

export type Cart = z.infer<typeof cartResponseSchema>;