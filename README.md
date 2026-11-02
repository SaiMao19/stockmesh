
# StockMesh

Real-Time Inventory Coordination System

## Overview

StockMesh is a full-stack inventory management
application designed to help businesses track
products and stock across multiple stores.

## Technology Stack

- TypeScript
- Node.js
- Express
- PostgreSQL
- React (planned)
- Vitest
- Supertest

## Current Features

- Product CRUD API
- PostgreSQL database
- Input validation
- Error handling
- Automated API testing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products |
| GET | /api/products/:id | Get product |
| POST | /api/products | Create product |
| PATCH | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |

## Local Development

1. Install dependencies in backend:

   npm install

2. Create backend/.env using .env.example.

3. Create the PostgreSQL database and run
   the SQL files in backend/db/.

4. Start the backend:

   npm run dev

## Testing

Run automated tests:

npm test

## Project Status

Backend product management completed.
Inventory management and frontend are in development.
