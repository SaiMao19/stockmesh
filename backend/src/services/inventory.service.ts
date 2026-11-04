
import pool from "../config/db.js";

import type {
  PoolClient,
  QueryResultRow
} from "pg";

import type {
  InventoryRow,
  ReceiveStockInput,
  AdjustStockInput,
  StockMovementRow,
  StockChangeResult
} from "../types/inventory.types.js";

// PostgreSQL INTEGER maximum
const MAX_STOCK = 2147483647;

// Custom error for inventory business rules
export class InventoryError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "InventoryError";
  }
}

// Internal database row types
interface LockedInventoryRow extends QueryResultRow {
  id: string;
  quantity: number;
}

interface QuantityRow extends QueryResultRow {
  quantity: number;
}

interface MovementIdRow extends QueryResultRow {
  id: string;
}

// Reusable SELECT columns
const INVENTORY_SELECT = `
  SELECT
    i.id::text AS id,
    i.store_id::text AS store_id,
    i.product_id::text AS product_id,
    s.name AS store_name,
    p.name AS product_name,
    i.quantity,
    i.updated_at
  FROM inventory i
  JOIN stores s ON s.id = i.store_id
  JOIN products p ON p.id = i.product_id
`;

// ======================================
// 1. GET ALL INVENTORY
// ======================================
export async function listInventory(): Promise<InventoryRow[]> {
  const result = await pool.query<InventoryRow>(
    `${INVENTORY_SELECT}
     ORDER BY s.name, p.name`
  );

  return result.rows;
}

// ======================================
// 2. GET INVENTORY BY ID
// ======================================
export async function findInventoryById(
  id: number
): Promise<InventoryRow | null> {

  const result = await pool.query<InventoryRow>(
    `${INVENTORY_SELECT}
     WHERE i.id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

// ======================================
// 3. GET STOCK MOVEMENT HISTORY
// ======================================
export async function listStockMovements(): Promise<StockMovementRow[]> {
  const result = await pool.query<StockMovementRow>(
    `SELECT
       id::text AS id,
       inventory_id::text AS inventory_id,
       quantity_change,
       reason,
       note,
       created_at
     FROM stock_movements
     ORDER BY created_at DESC, id DESC
     LIMIT 50`
  );

  return result.rows;
}

// ======================================
// HELPER: UPDATE QUANTITY AND HISTORY
// Must run inside a transaction.
// ======================================
async function applyStockChange(
  client: PoolClient,
  inventory: LockedInventoryRow,
  change: number,
  reason: "received" | "adjustment",
  note?: string
): Promise<StockChangeResult> {

  const newQuantity = inventory.quantity + change;

  // Prevent negative stock
  if (newQuantity < 0) {
    throw new InventoryError(
      "Insufficient stock",
      409
    );
  }

  // Prevent INTEGER overflow
  if (newQuantity > MAX_STOCK) {
    throw new InventoryError(
      "Stock quantity exceeds maximum",
      409
    );
  }

  // Update quantity
  const updated = await client.query<QuantityRow>(
    `UPDATE inventory
     SET quantity = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING quantity`,
    [newQuantity, inventory.id]
  );

  if (!updated.rows[0]) {
    throw new Error("Inventory update failed");
  }

  // Save movement history
  const movement = await client.query<MovementIdRow>(
    `INSERT INTO stock_movements
       (inventory_id, quantity_change, reason, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text AS id`,
    [
      inventory.id,
      change,
      reason,
      note ?? null
    ]
  );

  const savedMovement = movement.rows[0];

  if (!savedMovement) {
    throw new Error("Stock movement was not saved");
  }

  return {
    inventory_id: inventory.id,
    quantity: updated.rows[0].quantity,
    quantity_change: change,
    movement_id: savedMovement.id,
    reason
  };
}

// ======================================
// 4. RECEIVE NEW STOCK
// ======================================
export async function receiveStock(
  data: ReceiveStockInput
): Promise<StockChangeResult> {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create inventory record if missing
    await client.query(
      `INSERT INTO inventory
         (store_id, product_id, quantity)
       VALUES ($1, $2, 0)
       ON CONFLICT (store_id, product_id)
       DO NOTHING`,
      [data.store_id, data.product_id]
    );

    // Lock inventory row
    const result = await client.query<LockedInventoryRow>(
      `SELECT id::text AS id, quantity
       FROM inventory
       WHERE store_id = $1 AND product_id = $2
       FOR UPDATE`,
      [data.store_id, data.product_id]
    );

    const inventory = result.rows[0];

    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    // Update stock and create movement
    const response = await applyStockChange(
      client,
      inventory,
      data.quantity,
      "received",
      data.note
    );

    await client.query("COMMIT");

    return response;

  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    throw error;

  } finally {
    client.release();
  }
}

// ======================================
// 5. ADJUST EXISTING STOCK
// ======================================
export async function adjustStock(
  data: AdjustStockInput
): Promise<StockChangeResult> {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock existing inventory record
    const result = await client.query<LockedInventoryRow>(
      `SELECT id::text AS id, quantity
       FROM inventory
       WHERE id = $1
       FOR UPDATE`,
      [data.inventory_id]
    );

    const inventory = result.rows[0];

    if (!inventory) {
      throw new InventoryError(
        "Inventory record not found",
        404
      );
    }

    // Change quantity and save history
    const response = await applyStockChange(
      client,
      inventory,
      data.change,
      "adjustment",
      data.note
    );

    await client.query("COMMIT");

    return response;

  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    throw error;

  } finally {
    client.release();
  }
}
