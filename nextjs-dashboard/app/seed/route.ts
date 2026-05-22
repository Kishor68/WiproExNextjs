import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      image_url TEXT,
      about TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      password_reset_token TEXT,
      password_reset_token_expiry BIGINT
    );
  `;
  
  // Add columns if they don't exist (for existing databases)
  try {
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
      ADD COLUMN IF NOT EXISTS password_reset_token_expiry BIGINT;
    `;
  } catch (e) {
    console.log('Columns might already exist');
  }

  try {
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
    `;
  } catch (e) {
    console.log('Role column might already exist');
  }

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password, image_url, about, role)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, ${user.image_url}, ${user.about}, ${user.role ?? 'customer'})
        ON CONFLICT (id) DO UPDATE SET 
          role = ${user.role ?? 'customer'},
          name = ${user.name},
          about = ${user.about},
          image_url = ${user.image_url};
      `;
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedCustomerAccounts() {
  // Create user accounts for any customers that don't have users yet.
  const inserted = await Promise.all(
    customers.map(async (c) => {
      // default password for seeded customer accounts
      const defaultPassword = 'changeme';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      return sql`
        INSERT INTO users (id, name, email, password, image_url, about, role)
        VALUES (${c.id}, ${c.name}, ${c.email}, ${hashedPassword}, ${c.image_url}, '', 'customer')
        ON CONFLICT (email) DO NOTHING;
      `;
    }),
  );

  return inserted;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      seedUsers(),
      seedCustomers(),
      seedCustomerAccounts(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
