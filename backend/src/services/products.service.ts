import pool from "../config/db.js";

import type {
  CreateProduct,
  UpdateProduct,
  ProductRow,
  DeletedProductRow
} from "../types/product.types.js";

// Columns returned for a product
const PRODUCT_COLUMNS = `
  id::text AS id,
  sku,
  name,
  category,
  price::text AS price,
  supplier_id::text AS supplier_id
`;

// 1. GET ALL PRODUCTS
export async function listProducts(): Promise<ProductRow[]> {
  const result = await pool.query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     ORDER BY products.id`
  );

  return result.rows;
}

// 2. GET PRODUCT BY ID
export async function findProductById(
  id: number
): Promise<ProductRow | null> {

  const result = await pool.query<ProductRow>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

// 3. CREATE PRODUCT
export async function createProductInDb(
  product: CreateProduct
): Promise<ProductRow> {

  const result = await pool.query<ProductRow>(
    `INSERT INTO products (sku, name, category, price)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PRODUCT_COLUMNS}`,
    [
      product.sku,
      product.name,
      product.category,
      product.price
    ]
  );

  const created = result.rows[0];

  if (!created) {
    throw new Error("Product creation returned no row");
  }

  return created;
}

// 4. UPDATE PRODUCT
export async function updateProductInDb(
  id: number,
  update: UpdateProduct
): Promise<ProductRow | null> {

  const result = await pool.query<ProductRow>(
    `UPDATE products
     SET
       name = COALESCE($1::text, name),
       category = COALESCE($2::text, category),
       price = COALESCE($3::numeric, price)
     WHERE id = $4
     RETURNING ${PRODUCT_COLUMNS}`,
    [
      update.name ?? null,
      update.category ?? null,
      update.price ?? null,
      id
    ]
  );

  return result.rows[0] ?? null;
}

// 5. DELETE PRODUCT
export async function deleteProductInDb(
  id: number
): Promise<DeletedProductRow | null> {

  const result = await pool.query<DeletedProductRow>(
    `DELETE FROM products
     WHERE id = $1
     RETURNING id::text AS id, sku, name`,
    [id]
  );

  return result.rows[0] ?? null;
}
