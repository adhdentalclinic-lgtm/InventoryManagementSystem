-- Seed sample data for admin Inventory page
-- Run this in your Supabase SQL editor or with psql against the DB.

-- Products
INSERT INTO products (id, name, sku, category, quantity, cost_price, selling_price, image_url, created_at)
VALUES
  (gen_random_uuid(), 'BUILD CORD', 'BUILD CORD', 'Fashion & Apparel', 895, 150.00, 398.00, 'https://via.placeholder.com/64?text=BUILD', now()),
  (gen_random_uuid(), 'BUNDLE26', 'BUNDLE26', 'Bundles', 924, 200.00, 499.00, 'https://via.placeholder.com/64?text=B26', now()),
  (gen_random_uuid(), 'BUNDLE27', 'BUNDLE27', 'Bundles', 48, 100.00, 499.00, 'https://via.placeholder.com/64?text=B27', now()),
  (gen_random_uuid(), 'BUNDLE29', 'BUNDLE29', 'Bundles', 924, 200.00, 499.00, 'https://via.placeholder.com/64?text=B29', now()),
  (gen_random_uuid(), 'BUNDLE31', 'BUNDLE31', 'Bundles', 924, 200.00, 499.00, 'https://via.placeholder.com/64?text=B31', now()),
  (gen_random_uuid(), 'SAMPLE PRODUCT A', 'SPA-001', 'Accessories', 120, 50.00, 149.00, 'https://via.placeholder.com/64?text=SPA', now()),
  (gen_random_uuid(), 'SAMPLE PRODUCT B', 'SPB-002', 'Gadgets', 30, 300.00, 699.00, 'https://via.placeholder.com/64?text=SPB', now());

-- Create initial stock_movements to reflect available quantities (IN movements)
INSERT INTO stock_movements (id, product_id, type, quantity, note, created_at)
SELECT gen_random_uuid(), p.id, 'IN', p.quantity, 'Initial seed', now()
FROM products p;

-- Optional: Create a few cashflow records (historical sales)
INSERT INTO cashflow (id, type, amount, description, category, created_at)
VALUES
  (gen_random_uuid(), 'IN', 1250.00, 'Sample sale - order #1001', 'sales', now()),
  (gen_random_uuid(), 'IN', 3499.00, 'Sample sale - order #1002', 'sales', now());

-- Note: If your `profiles` table has FK referencing auth.users(id), create admin/staff users via Supabase Auth
-- then insert profile rows with the corresponding auth user ids. Example (replace <ADMIN_UUID>):
-- INSERT INTO profiles (id, email, full_name, role) VALUES ('<ADMIN_UUID>', 'admin@example.com', 'Admin User', 'admin');

COMMIT;
