import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";
import { start } from "node:repl";

const PORT = Number(process.env.PORT) || 4000;

async function startServer(): Promise<void> {
    try{
        await pool.query("SELECT 1");
        console.log("PostgreSQL connected successfully");

        app.listen(PORT, () => {
            console.log(
                `StockMesh API running at http://localhost:${PORT}`
            );
        });
    } catch(error){
        console.error("Database connection failed:", error);

        process.exitCode = 1;
        await pool.end();
    }
}

void startServer();