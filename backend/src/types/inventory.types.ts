
import type { QueryResultRow } from "pg";

// Inventory record returned from PostgreSQL
export interface InventoryRow extends QueryResultRow {
  id: string;
  store_id: string;
  product_id: string;
  store_name: string;
  product_name: string;
  quantity: number;
  updated_at: Date;
}

// Input for receiving new stock
export interface ReceiveStockInput {
  store_id: number;
  product_id: number;
  quantity: number;
  note?: string;
}

// Input for adjusting existing stock
export interface AdjustStockInput {
  inventory_id: number;
  change: number;
  note?: string;
}

// Stock movement returned from PostgreSQL
export interface StockMovementRow extends QueryResultRow {
  id: string;
  inventory_id: string;
  quantity_change: number;
  reason: string;
  note: string | null;
  created_at: Date;
}

// Successful stock change response
export interface StockChangeResult {
  inventory_id: string;
  quantity: number;
  quantity_change: number;
  movement_id: string;
  reason: "received" | "adjustment";
}
