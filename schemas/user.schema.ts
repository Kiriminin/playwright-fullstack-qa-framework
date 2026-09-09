import { z } from "zod";

const userAddressSchema = z.object({
  street: z.string(),
  house_number: z.string().nullable(),
  city: z.string(),
  state: z.string().nullable(),
  country: z.string(),
  postal_code: z.string().nullable(),
});

export const userResponseSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  address: userAddressSchema,
  phone: z.string().nullable(),
  dob: z.string(),
  email: z.string().email(),
  provider: z.string().nullable().optional(),
totp_enabled: z.boolean().optional(),
enabled: z.boolean().optional(),
failed_login_attempts: z.number().int().nullable().optional(),
  created_at: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;