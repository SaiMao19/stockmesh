
import { Router } from "express";

import {
  getAllInventory,
  getInventoryById,
  getMovements,
  receiveInventoryStock,
  adjustInventoryStock
} from "../controllers/inventory.controller.js";

import {
  receiveStockSchema,
  adjustStockSchema
} from "../schemas/inventory.schema.js";

import {
  validateBody
} from "../middleware/validate.middleware.js";

const router = Router();

// GET all inventory
router.get("/", getAllInventory);

// GET stock movement history
router.get("/movements", getMovements);

// GET inventory by ID
router.get("/:id", getInventoryById);

// Receive stock
router.post(
  "/receive",
  validateBody(receiveStockSchema),
  receiveInventoryStock
);

// Adjust stock
router.post(
  "/adjust",
  validateBody(adjustStockSchema),
  adjustInventoryStock
);

export default router;
