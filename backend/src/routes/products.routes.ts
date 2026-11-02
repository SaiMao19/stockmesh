
import { Router } from "express";

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/products.controller.js";

const router = Router();

// Read all products
router.get("/", getAllProducts);

// Read one product
router.get("/:id", getProductById);

// Create a product
router.post("/", createProduct);

// Update a product
router.patch("/:id", updateProduct);

// Delete a product
router.delete("/:id", deleteProduct);

export default router;
