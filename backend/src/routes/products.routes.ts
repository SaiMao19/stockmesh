
import { Router } from "express";

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/products.controller.js";

import {
  createProductSchema,
  updateProductSchema
} from "../schemas/product.schema.js";

import {
  validateBody
} from "../middleware/validate.middleware.js";

const router = Router();

// GET all products
router.get("/", getAllProducts);

// GET one product
router.get("/:id", getProductById);

// CREATE product
router.post(
  "/",
  validateBody(createProductSchema),
  createProduct
);

// UPDATE product
router.patch(
  "/:id",
  validateBody(updateProductSchema),
  updateProduct
);

// DELETE product
router.delete("/:id", deleteProduct);

export default router;
