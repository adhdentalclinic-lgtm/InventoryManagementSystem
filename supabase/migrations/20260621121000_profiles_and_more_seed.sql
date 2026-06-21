-- Optional: Insert admin and staff profiles (replace <ADMIN_UUID> and <STAFF_UUID> with actual auth.user ids)
-- IMPORTANT: `profiles.id` references `auth.users(id)`. Create users in Supabase Auth first, then run these statements with their UUIDs.

-- Example:
-- INSERT INTO profiles (id, email, full_name, role, created_at)
-- VALUES ('<ADMIN_UUID>', 'admin@example.com', 'Admin User', 'admin', now());
-- INSERT INTO profiles (id, email, full_name, role, created_at)
-- VALUES ('<STAFF_UUID>', 'staff@example.com', 'Staff User', 'staff', now());

-- Additional sample products (non-duplicating SKUs)
INSERT INTO products (id, name, sku, category, quantity, cost_price, selling_price, image_url, created_at)
VALUES
  (gen_random_uuid(), 'SILVER NECKLACE', 'SN-101', 'Fashion & Apparel', 150, 120.00, 299.00, 'https://via.placeholder.com/64?text=SN', now()),
  (gen_random_uuid(), 'WIRELESS CHARGER', 'WC-201', 'Gadgets', 60, 250.00, 599.00, 'https://via.placeholder.com/64?text=WC', now()),
  (gen_random_uuid(), 'LEATHER WALLET', 'LW-301', 'Accessories', 340, 80.00, 199.00, 'https://via.placeholder.com/64?text=LW', now()),
  (gen_random_uuid(), 'BUNDLE50', 'BUNDLE50', 'Bundles', 200, 180.00, 450.00, 'https://via.placeholder.com/64?text=B50', now());

-- Create IN movements for these additional products
INSERT INTO stock_movements (id, product_id, type, quantity, note, created_at)
SELECT gen_random_uuid(), p.id, 'IN', p.quantity, 'Seed add', now()
FROM products p
WHERE p.sku IN ('SN-101','WC-201','LW-301','BUNDLE50');

COMMIT;
