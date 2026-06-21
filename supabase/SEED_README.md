Seed and setup instructions

1) Apply seed SQL files

- Open Supabase project → SQL Editor → paste the contents of the migration files in `supabase/migrations/` (order them by filename):
  - `20260621120000_seed_sample_data.sql`
  - `20260621121000_profiles_and_more_seed.sql`

- Or run using psql (replace with your DB connection string):

```bash
psql "<YOUR_DB_CONN_STRING>" -f supabase/migrations/20260621120000_seed_sample_data.sql
psql "<YOUR_DB_CONN_STRING>" -f supabase/migrations/20260621121000_profiles_and_more_seed.sql
```

2) Creating admin and staff users (required for `profiles` FK):

- Create users via Supabase Dashboard → Authentication → Users → Invite or Sign up.
- Copy the user's `id` (UUID). Use that value to insert into `profiles`:

```sql
INSERT INTO profiles (id, email, full_name, role) VALUES
  ('<ADMIN_USER_UUID>', 'admin@example.com', 'Admin User', 'admin'),
  ('<STAFF_USER_UUID>', 'staff@example.com', 'Staff User', 'staff');
```

3) Notes and troubleshooting

- `profiles.id` references `auth.users(id)`. You must use real auth user UUIDs for FK constraints to succeed.
- If you only want to preview products without profiles, run only the product/cashflow/stock seed SQL files.
- For production, replace placeholder image URLs with your CDN paths.

4) Verify

- After running the SQL, open your app and login with the admin user to view the Inventory page with sample data.
- Use the staff account to test the Order Dispatch flow which will create `stock_movements` (OUT) and `cashflow` entries.
