import type { QueryResultRow } from "pg";

//create a product
export interface CreateProduct {
    sku: string;
    name: string;
    category: string;
    price: number;
}

//updated product
export interface UpdateProduct {
    name?: string;
    category?: string;
    price?: number;
}

//show product
export interface ProductRow extends QueryResultRow {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: string;
    supplier_id: string | null;
}

//return data delete
export interface DeletedProductRow extends QueryResultRow {
    id: string;
    sku: string;
    name: string;
}

//api response after successful deletion
export interface DeleteProductResponse {
    message: string;
    deletedProduct: DeletedProductRow;
}