
-- Suppliers
INSERT INTO suppliers (name, email)
VALUES
('North Textiles', 'sales@north.example'),
('Peak Footwear', 'sales@peak.example'),
('Cedar Apparel', 'sales@cedar.example')
ON CONFLICT (name) DO NOTHING;

-- Stores
INSERT INTO stores (code, name, city)
VALUES
('LON', 'London Branch', 'London'),
('MAN', 'Manchester Branch', 'Manchester'),
('BIR', 'Birmingham Branch', 'Birmingham')
ON CONFLICT (code) DO NOTHING;

-- Products
INSERT INTO products
(sku, name, category, price, supplier_id)
VALUES
(
    'SHIRT-001',
    'Classic T-Shirt',
    'Clothing',
    29.99,
    (SELECT id FROM suppliers WHERE name = 'North Textiles')
),
(
    'SHOE-001',
    'Running Shoes',
    'Footwear',
    79.99,
    (SELECT id FROM suppliers WHERE name = 'Peak Footwear')
),
(
    'JACKET-001',
    'Rain Jacket',
    'Outerwear',
    59.99,
    (SELECT id FROM suppliers WHERE name = 'Cedar Apparel')
)
ON CONFLICT (sku) DO NOTHING;

-- Initial inventory balances
INSERT INTO inventory (store_id, product_id, quantity)
SELECT s.id, p.id, seed.quantity
FROM (
    VALUES
    ('LON', 'SHIRT-001', 30),
    ('MAN', 'SHIRT-001', 15),
    ('BIR', 'SHIRT-001', 20),
    ('LON', 'SHOE-001', 10),
    ('MAN', 'SHOE-001', 25),
    ('BIR', 'SHOE-001', 8),
    ('LON', 'JACKET-001', 12),
    ('MAN', 'JACKET-001', 7),
    ('BIR', 'JACKET-001', 18)
) AS seed(store_code, product_sku, quantity)
JOIN stores s ON s.code = seed.store_code
JOIN products p ON p.sku = seed.product_sku
ON CONFLICT (store_id, product_id) DO NOTHING;
