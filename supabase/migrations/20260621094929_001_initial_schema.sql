/*
# Initial Inventory Management System Schema

1. New Tables
- `profiles` - Extended user profiles with role (admin/staff)
- `products` - Inventory items with SKU, category, quantities, pricing
- `stock_movements` - IN/OUT stock movement logs
- `cashflow` - Cash in/out financial records

2. Security
- Enable RLS on all tables
- Role-based policies (admin full access, staff limited)
- Prevent negative inventory via trigger
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity integer NOT NULL CHECK (quantity > 0),
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('IN', 'OUT')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_type ON cashflow(type);
CREATE INDEX IF NOT EXISTS idx_cashflow_created_at ON cashflow(created_at);

-- Trigger to prevent negative inventory on stock OUT
CREATE OR REPLACE FUNCTION check_stock_before_out()
RETURNS TRIGGER AS $$
DECLARE
  current_qty integer;
BEGIN
  IF NEW.type = 'OUT' THEN
    SELECT quantity INTO current_qty FROM products WHERE id = NEW.product_id;
    IF current_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock: available %, requested %', current_qty, NEW.quantity;
    END IF;
    UPDATE products SET quantity = quantity - NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  ELSIF NEW.type = 'IN' THEN
    UPDATE products SET quantity = quantity + NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_stock ON stock_movements;
CREATE TRIGGER trg_check_stock
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_before_out();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_profiles" ON profiles;
CREATE POLICY "insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Products policies (all authenticated can read, admin can write)
DROP POLICY IF EXISTS "select_products" ON products;
CREATE POLICY "select_products" ON products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_products" ON products;
CREATE POLICY "insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "update_products" ON products;
CREATE POLICY "update_products" ON products FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "delete_products" ON products;
CREATE POLICY "delete_products" ON products FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Stock movements policies
DROP POLICY IF EXISTS "select_stock_movements" ON stock_movements;
CREATE POLICY "select_stock_movements" ON stock_movements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_stock_movements" ON stock_movements;
CREATE POLICY "insert_stock_movements" ON stock_movements FOR INSERT
  TO authenticated WITH CHECK (true);

-- Cashflow policies
DROP POLICY IF EXISTS "select_cashflow" ON cashflow;
CREATE POLICY "select_cashflow" ON cashflow FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_cashflow" ON cashflow;
CREATE POLICY "insert_cashflow" ON cashflow FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_cashflow" ON cashflow;
CREATE POLICY "update_cashflow" ON cashflow FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "delete_cashflow" ON cashflow;
CREATE POLICY "delete_cashflow" ON cashflow FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
