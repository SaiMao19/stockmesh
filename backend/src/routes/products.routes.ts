
import { Router } from "express";

// Import controllers
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/products.controller.js";

// Import Zod schemas
import {
  createProductSchema,
  updateProductSchema
} from "../schemas/product.schema.js";

// Import validation middleware
import {
  validateBody
} from "../middleware/validate.middleware.js";

const router = Router();

// 1. GET all products
router.get("/", getAllProducts);

// 2. GET product by ID
router.get("/:id", getProductById);

// 3. POST - Create product
router.post(
  "/",
  validateBody(createProductSchema),
  createProduct
);

// 4. PATCH - Update product
router.patch(
  "/:id",
  validateBody(updateProductSchema),
  updateProduct
);

// 5. DELETE product
router.delete("/:id", deleteProduct);

export default router;
