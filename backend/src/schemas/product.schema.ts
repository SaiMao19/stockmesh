
import { z } from "zod";

import type {
  CreateProduct,
  UpdateProduct
} from "../types/product.types.js";

// ========================================
// 1. PRICE VALIDATION
// ========================================

const priceSchema = z.number()
  .finite()
  .min(0, {
    error: "Price cannot be negative"
  })
  .max(99999999.99, {
    error: "Price is too large"
  })
  .refine(
    (price) => Number(price.toFixed(2)) === price,
    {
      error: "Price must have at most 2 decimal places"
    }
  );

// ========================================
// 2. CREATE PRODUCT SCHEMA
// ========================================

export const createProductSchema = z.strictObject({

  sku: z.string()
    .trim()
    .min(1, {
      error: "SKU is required"
    })
    .max(40, {
      error: "SKU must be 40 characters or less"
    }),

  name: z.string()
    .trim()
    .min(1, {
      error: "Product name is required"
    })
    .max(150, {
      error: "Product name is too long"
    }),

  category: z.string()
    .trim()
    .min(1, {
      error: "Category is required"
    })
    .max(80, {
      error: "Category must be 80 characters or less"
    }),

  price: priceSchema

}) satisfies z.ZodType<CreateProduct>;

// ========================================
// 3. UPDATE PRODUCT SCHEMA
// ========================================

export const updateProductSchema = createProductSchema
  .pick({
    name: true,
    category: true,
    price: true
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      error: "Provide name, category or price"
    }
  ) satisfies z.ZodType<UpdateProduct>;
