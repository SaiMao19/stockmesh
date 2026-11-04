
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.routes.js";
import inventoryRouter from "./routes/inventory.routes.js"

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "StockMesh API is running"
  });
});

// Application information
app.get("/api/info", (_req, res) => {
  res.status(200).json({
    name: "StockMesh",
    version: "1.0.0",
    developerRole: "Junior Software Developer"
  });
});

// Product API routes
app.use("/api/products", productsRouter);

app.use("/api/inventory", inventoryRouter)

export default app;
