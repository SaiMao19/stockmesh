
import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from "vitest";

import request from "supertest";

// Create a fake database query
const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn()
}));

// Replace the real database connection in tests
vi.mock("../src/config/db.js", () => ({
  default: {
    query: queryMock
  }
}));

import app from "../src/app.js";

// Sample product for testing
const product = {
  id: "1",
  sku: "SHIRT-001",
  name: "Classic T-Shirt",
  category: "Clothing",
  price: "29.99",
  supplier_id: null
};

// Clear previous mock results before every test
beforeEach(() => {
  queryMock.mockReset();
});

describe("StockMesh Products API", () => {

  // TEST 1 - GET all products
  it("GET /api/products returns products", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [product]
    });

    const res = await request(app)
      .get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([product]);
  });

  // TEST 2 - GET product by ID
  it("GET /api/products/1 returns a product", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [product]
    });

    const res = await request(app)
      .get("/api/products/1");

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Classic T-Shirt");
  });

  // TEST 3 - Invalid product ID
  it("rejects an invalid product ID", async () => {
    const res = await request(app)
      .get("/api/products/abc");

    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  // TEST 4 - Product not found
  it("returns 404 when product does not exist", async () => {
    queryMock.mockResolvedValueOnce({
      rows: []
    });

    const res = await request(app)
      .get("/api/products/999");

    expect(res.status).toBe(404);
  });

  // TEST 5 - Create product
  it("POST /api/products creates a product", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [product]
    });

    const res = await request(app)
      .post("/api/products")
      .send({
        sku: "SHIRT-001",
        name: "Classic T-Shirt",
        category: "Clothing",
        price: 29.99
      });

    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("SHIRT-001");
  });

  // TEST 6 - Reject invalid price
  it("rejects negative prices", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({
        sku: "TEST-001",
        name: "Test",
        category: "Testing",
        price: -10
      });

    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  // TEST 7 - Reject duplicate SKU
  it("returns 409 for duplicate SKU", async () => {
    queryMock.mockRejectedValueOnce({
      code: "23505"
    });

    const res = await request(app)
      .post("/api/products")
      .send({
        sku: "SHIRT-001",
        name: "Classic T-Shirt",
        category: "Clothing",
        price: 29.99
      });

    expect(res.status).toBe(409);
  });

  // TEST 8 - Update product
  it("PATCH /api/products/1 updates price", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ ...product, price: "39.99" }]
    });

    const res = await request(app)
      .patch("/api/products/1")
      .send({
        price: 39.99
      });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe("39.99");
  });

  // TEST 9 - Reject empty update
  it("rejects empty PATCH request", async () => {
    const res = await request(app)
      .patch("/api/products/1")
      .send({});

    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  // TEST 10 - Delete product
  it("DELETE /api/products/1 deletes a product", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "1",
        sku: "SHIRT-001",
        name: "Classic T-Shirt"
      }]
    });

    const res = await request(app)
      .delete("/api/products/1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      "Product deleted successfully"
    );
  });

  // TEST 11 - Foreign key protection
  it("returns 409 when inventory references product", async () => {
    queryMock.mockRejectedValueOnce({
      code: "23503"
    });

    const res = await request(app)
      .delete("/api/products/1");

    expect(res.status).toBe(409);
  });

});
