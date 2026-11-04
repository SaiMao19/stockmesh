
import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from "vitest";

import request from "supertest";

// Create mock functions
const {
  poolQueryMock,
  connectMock,
  clientQueryMock,
  releaseMock
} = vi.hoisted(() => ({
  poolQueryMock: vi.fn(),
  connectMock: vi.fn(),
  clientQueryMock: vi.fn(),
  releaseMock: vi.fn()
}));

// Mock PostgreSQL pool
vi.mock("../src/config/db.js", () => ({
  default: {
    query: poolQueryMock,
    connect: connectMock
  }
}));

import app from "../src/app.js";

beforeEach(() => {
  vi.resetAllMocks();

  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: releaseMock
  });
});

describe("StockMesh Inventory API", () => {

  // TEST 1: GET all inventory
  it("returns inventory records", async () => {
    poolQueryMock.mockResolvedValueOnce({
      rows: [{
        id: "1",
        store_id: "1",
        product_id: "2",
        store_name: "London Branch",
        product_name: "Running Shoes",
        quantity: 10
      }]
    });

    const res = await request(app)
      .get("/api/inventory");

    expect(res.status).toBe(200);
    expect(res.body[0].quantity).toBe(10);
  });

  // TEST 2: Invalid inventory ID
  it("rejects invalid inventory ID", async () => {
    const res = await request(app)
      .get("/api/inventory/abc");

    expect(res.status).toBe(400);
    expect(poolQueryMock).not.toHaveBeenCalled();
  });

  // TEST 3: GET movement history
  it("returns stock movements", async () => {
    poolQueryMock.mockResolvedValueOnce({
      rows: []
    });

    const res = await request(app)
      .get("/api/inventory/movements");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // TEST 4: Reject negative receive quantity
  it("rejects negative stock receiving", async () => {
    const res = await request(app)
      .post("/api/inventory/receive")
      .send({
        store_id: 1,
        product_id: 2,
        quantity: -10
      });

    expect(res.status).toBe(400);
    expect(connectMock).not.toHaveBeenCalled();
  });

  // TEST 5: Receive stock successfully
  it("receives stock in a transaction", async () => {

    clientQueryMock.mockImplementation(
      async (sql: string) => {

        if (sql === "BEGIN" || sql === "COMMIT") {
          return { rows: [] };
        }

        if (sql.includes("ON CONFLICT")) {
          return { rows: [] };
        }

        if (sql.includes("FOR UPDATE")) {
          return {
            rows: [{ id: "10", quantity: 10 }]
          };
        }

        if (sql.includes("UPDATE inventory")) {
          return {
            rows: [{ quantity: 15 }]
          };
        }

        if (sql.includes("INSERT INTO stock_movements")) {
          return {
            rows: [{ id: "100" }]
          };
        }

        throw new Error("Unexpected SQL query");
      }
    );

    const res = await request(app)
      .post("/api/inventory/receive")
      .send({
        store_id: 1,
        product_id: 2,
        quantity: 5
      });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(15);

    expect(clientQueryMock)
      .toHaveBeenCalledWith("BEGIN");

    expect(clientQueryMock)
      .toHaveBeenCalledWith("COMMIT");

    expect(releaseMock).toHaveBeenCalled();
  });

  // TEST 6: ROLLBACK for insufficient stock
  it("rolls back insufficient stock adjustment", async () => {

    clientQueryMock.mockImplementation(
      async (sql: string) => {

        if (sql === "BEGIN" || sql === "ROLLBACK") {
          return { rows: [] };
        }

        if (sql.includes("FOR UPDATE")) {
          return {
            rows: [{ id: "10", quantity: 3 }]
          };
        }

        throw new Error("Unexpected SQL query");
      }
    );

    const res = await request(app)
      .post("/api/inventory/adjust")
      .send({
        inventory_id: 10,
        change: -8
      });

    expect(res.status).toBe(409);

    expect(clientQueryMock)
      .toHaveBeenCalledWith("ROLLBACK");

    expect(clientQueryMock)
      .not.toHaveBeenCalledWith("COMMIT");

    expect(releaseMock).toHaveBeenCalled();
  });

  // TEST 7: ROLLBACK when movement insert fails
  it("rolls back when movement history fails", async () => {

    clientQueryMock.mockImplementation(
      async (sql: string) => {

        if (sql === "BEGIN" || sql === "ROLLBACK") {
          return { rows: [] };
        }

        if (sql.includes("FOR UPDATE")) {
          return {
            rows: [{ id: "10", quantity: 10 }]
          };
        }

        if (sql.includes("UPDATE inventory")) {
          return {
            rows: [{ quantity: 15 }]
          };
        }

        if (sql.includes("INSERT INTO stock_movements")) {
          throw new Error("Movement insert failed");
        }

        throw new Error("Unexpected SQL query");
      }
    );

    const res = await request(app)
      .post("/api/inventory/adjust")
      .send({
        inventory_id: 10,
        change: 5
      });

    expect(res.status).toBe(500);

    expect(clientQueryMock)
      .toHaveBeenCalledWith("ROLLBACK");

    expect(releaseMock).toHaveBeenCalled();
  });

});
