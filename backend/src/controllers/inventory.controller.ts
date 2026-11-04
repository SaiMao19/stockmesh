
import type { Request, Response } from "express";

import type {
  ReceiveStockInput,
  AdjustStockInput
} from "../types/inventory.types.js";

import {
  InventoryError,
  listInventory,
  findInventoryById,
  listStockMovements,
  receiveStock,
  adjustStock
} from "../services/inventory.service.js";

// Convert URL ID into a safe number
function parseId(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

// Handle database errors
function handleError(error: unknown, res: Response): void {

  // Business errors: insufficient stock, not found
  if (error instanceof InventoryError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  // Invalid store or product reference
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23503"
  ) {
    res.status(404).json({
      message: "Store or product not found"
    });
    return;
  }

  console.error("Inventory error:", error);

  res.status(500).json({
    message: "Server error"
  });
}

// =====================================
// GET ALL INVENTORY
// =====================================
export async function getAllInventory(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const inventory = await listInventory();

    res.status(200).json(inventory);

  } catch (error) {
    handleError(error, res);
  }
}

// =====================================
// GET INVENTORY BY ID
// =====================================
export async function getInventoryById(
  req: Request,
  res: Response
): Promise<void> {

  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "Invalid inventory ID"
    });
    return;
  }

  try {
    const inventory = await findInventoryById(id);

    if (inventory === null) {
      res.status(404).json({
        message: "Inventory not found"
      });
      return;
    }

    res.status(200).json(inventory);

  } catch (error) {
    handleError(error, res);
  }
}

// =====================================
// GET STOCK MOVEMENTS
// =====================================
export async function getMovements(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const movements = await listStockMovements();

    res.status(200).json(movements);

  } catch (error) {
    handleError(error, res);
  }
}

// =====================================
// RECEIVE STOCK
// =====================================
export async function receiveInventoryStock(
  req: Request,
  res: Response
): Promise<void> {

  // Validated by Zod middleware
  const data =
    res.locals.validatedBody as ReceiveStockInput;

  try {
    const result = await receiveStock(data);

    res.status(200).json({
      message: "Stock received successfully",
      ...result
    });

  } catch (error) {
    handleError(error, res);
  }
}

// =====================================
// ADJUST STOCK
// =====================================
export async function adjustInventoryStock(
  req: Request,
  res: Response
): Promise<void> {

  // Validated by Zod middleware
  const data =
    res.locals.validatedBody as AdjustStockInput;

  try {
    const result = await adjustStock(data);

    res.status(200).json({
      message: "Stock adjusted successfully",
      ...result
    });

  } catch (error) {
    handleError(error, res);
  }
}
