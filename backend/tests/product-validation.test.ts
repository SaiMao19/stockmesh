
import { describe, it, expect } from "vitest";

import {
  createProductSchema,
  updateProductSchema
} from "../src/schemas/product.schema.js";

describe("Product Zod Validation", () => {

  it("accepts a valid product", () => {
    const result = createProductSchema.safeParse({
      sku: "BAG-001",
      name: "Backpack",
      category: "Accessories",
      price: 39.99
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative price", () => {
    const result = createProductSchema.safeParse({
      sku: "BAG-001",
      name: "Backpack",
      category: "Accessories",
      price: -10
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = createProductSchema.safeParse({
      sku: "BAG-001",
      name: "   ",
      category: "Accessories",
      price: 39.99
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown field", () => {
    const result = createProductSchema.safeParse({
      sku: "BAG-001",
      name: "Backpack",
      category: "Accessories",
      price: 39.99,
      isAdmin: true
    });

    expect(result.success).toBe(false);
  });

  it("accepts price-only PATCH", () => {
    const result = updateProductSchema.safeParse({
      price: 49.99
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty PATCH", () => {
    const result = updateProductSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("trims product text", () => {
    const result = createProductSchema.safeParse({
      sku: " BAG-001 ",
      name: " Backpack ",
      category: " Accessories ",
      price: 39.99
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Backpack");
      expect(result.data.sku).toBe("BAG-001");
    }
  });

});
