
import { z } from "zod";

// PostgreSQL INTEGER maximum
const MAX_STOCK = 2147483647;

// Positive, safe integer ID
const idSchema = z.int().positive();

// Optional note
const noteSchema = z.string()
  .trim()
  .max(500)
  .optional();

// Receive stock schema
export const receiveStockSchema = z.strictObject({
  store_id: idSchema,
  product_id: idSchema,
  quantity: z.int().min(1).max(MAX_STOCK),
  note: noteSchema
});

// Adjust stock schema
export const adjustStockSchema = z.strictObject({
  inventory_id: idSchema,
  change: z.int()
    .min(-MAX_STOCK)
    .max(MAX_STOCK)
    .refine(value => value !== 0, {
      error: "Change cannot be zero"
    }),
  note: noteSchema
});
