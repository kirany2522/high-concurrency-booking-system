import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LOCK_TTL_MS: z.coerce.number().int().positive().default(30000),
  ADMIN_API_KEY: z.string().min(1).default("dev-admin-key"),
});

export const env = envSchema.parse(process.env);
