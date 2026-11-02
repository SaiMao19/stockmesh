
import type { Request, Response } from "express";

import type {
  CreateProduct,
  UpdateProduct,
  DeleteProductResponse
} from "../types/product.types.js";

import {
  listProducts,
  findProductById,
  createProductInDb,
  updateProductInDb,
  deleteProductInDb
} from "../services/products.service.js";

// Check product ID
function parseProductId(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value)
  ) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

// Check JSON object
function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// Check price
function isValidPrice(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 99999999.99 &&
    Number(value.toFixed(2)) === value
  );
}

// Check PostgreSQL error codes
function hasDbCode(error: unknown, code: string): boolean {
  return (
    isObject(error) &&
    error.code === code
  );
}

// 1. GET ALL PRODUCTS
export async function getAllProducts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const products = await listProducts();

    res.status(200).json(products);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
}

// 2. GET PRODUCT BY ID
export async function getProductById(
  req: Request,
  res: Response
): Promise<void> {

  const id = parseProductId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "Invalid product ID"
    });
    return;
  }

  try {
    const product = await findProductById(id);

    if (product === null) {
      res.status(404).json({
        message: "Product not found"
      });
      return;
    }

    res.status(200).json(product);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
}

// 3. CREATE PRODUCT
export async function createProduct(
  req: Request,
  res: Response
): Promise<void> {

  const body: unknown = req.body;

  if (!isObject(body)) {
    res.status(400).json({
      message: "Invalid product data"
    });
    return;
  }

  const { sku, name, category, price } = body;

  // Validate text
  if (
    typeof sku !== "string" ||
    typeof name !== "string" ||
    typeof category !== "string" ||
    !sku.trim() ||
    !name.trim() ||
    !category.trim() ||
    sku.trim().length > 40 ||
    name.trim().length > 150 ||
    category.trim().length > 80
  ) {
    res.status(400).json({
      message: "Invalid product data"
    });
    return;
  }

  // Validate price
  if (!isValidPrice(price)) {
    res.status(400).json({
      message: "Invalid product price"
    });
    return;
  }

  const product: CreateProduct = {
    sku: sku.trim(),
    name: name.trim(),
    category: category.trim(),
    price
  };

  try {
    const created = await createProductInDb(product);

    res.status(201).json(created);

  } catch (error) {
    console.error(error);

    if (hasDbCode(error, "23505")) {
      res.status(409).json({
        message: "Product SKU already exists"
      });
      return;
    }

    res.status(500).json({
      message: "Server error"
    });
  }
}

// 4. UPDATE PRODUCT
export async function updateProduct(
  req: Request,
  res: Response
): Promise<void> {

  const id = parseProductId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "Invalid product ID"
    });
    return;
  }

  const body: unknown = req.body;

  if (!isObject(body)) {
    res.status(400).json({
      message: "Invalid request body"
    });
    return;
  }

  const fields = Object.keys(body);
  const allowed = ["name", "category", "price"];

  if (
    fields.length === 0 ||
    fields.some(field => !allowed.includes(field))
  ) {
    res.status(400).json({
      message: "Provide name, category or price"
    });
    return;
  }

  const { name, category, price } = body;

  if (
    name !== undefined &&
    (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 150
    )
  ) {
    res.status(400).json({
      message: "Invalid product name"
    });
    return;
  }

  if (
    category !== undefined &&
    (
      typeof category !== "string" ||
      !category.trim() ||
      category.trim().length > 80
    )
  ) {
    res.status(400).json({
      message: "Invalid category"
    });
    return;
  }

  if (
    price !== undefined &&
    !isValidPrice(price)
  ) {
    res.status(400).json({
      message: "Invalid price"
    });
    return;
  }

  const update: UpdateProduct = {};

  if (typeof name === "string") {
    update.name = name.trim();
  }

  if (typeof category === "string") {
    update.category = category.trim();
  }

  if (typeof price === "number") {
    update.price = price;
  }

  try {
    const updated = await updateProductInDb(id, update);

    if (updated === null) {
      res.status(404).json({
        message: "Product not found"
      });
      return;
    }

    res.status(200).json(updated);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
}

// 5. DELETE PRODUCT
export async function deleteProduct(
  req: Request,
  res: Response
): Promise<void> {

  const id = parseProductId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "Invalid product ID"
    });
    return;
  }

  try {
    const deleted = await deleteProductInDb(id);

    if (deleted === null) {
      res.status(404).json({
        message: "Product not found"
      });
      return;
    }

    const response: DeleteProductResponse = {
      message: "Product deleted successfully",
      deletedProduct: deleted
    };

    res.status(200).json(response);

  } catch (error) {
    console.error(error);

    if (hasDbCode(error, "23503")) {
      res.status(409).json({
        message: "Cannot delete product with inventory records"
      });
      return;
    }

    res.status(500).json({
      message: "Server error"
    });
  }
}
