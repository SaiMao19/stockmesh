
import { z } from "zod";

import type {
  CreateProduct,
  UpdateProduct
} from "../types/product.types.js";

// Reusable price validation
const priceSchema = z.number()
  .finite()
  .min(0)
  .max(99999999.99)
  .refine(
    (price) => Number(price.toFixed(2)) === price,
    { error: "Price must have at most 2 decimal places" }
  );

// CREATE PRODUCT
export const createProductSchema = z.strictObject({
  sku: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(80),
  price: priceSchema
}) satisfies z.ZodType<CreateProduct>;

// UPDATE PRODUCT
export const updateProductSchema = createProductSchema
  .pick({
    name: true,
    category: true,
    price: true
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { error: "Provide name, category or price" }
  ) satisfies z.ZodType<UpdateProduct>;
