import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  UI_BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
});

export const env = envSchema.parse(process.env);