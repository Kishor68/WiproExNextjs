import postgres from 'postgres';

export type AppNotification = {
  id: string;
  user_id: string;
  message: string;
  type: 'success' | 'error';
  read_at: string | null;
  created_at: string;
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function ensureNotificationsTable() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'success',
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export async function createNotificationForUser(
  userId: string,
  message: string,
  type: AppNotification['type'] = 'success',
) {
  await ensureNotificationsTable();
  await sql`
    INSERT INTO notifications (user_id, message, type)
    VALUES (${userId}, ${message}, ${type})
  `;
}

export async function createInvoiceNotificationForCustomer(
  customerId: string,
  amountInCents: number,
) {
  await ensureNotificationsTable();

  const users = await sql<{ id: string; name: string }[]>`
    SELECT users.id, users.name
    FROM users
    JOIN customers ON customers.email = users.email
    WHERE customers.id = ${customerId}
    LIMIT 1
  `;

  const customerUser = users[0];
  if (!customerUser) {
    return;
  }

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);

  await createNotificationForUser(
    customerUser.id,
    `A new invoice for ${amount} has been created for you.`,
  );
}

export async function fetchUnreadNotificationsForUser(userId: string) {
  await ensureNotificationsTable();

  return sql<AppNotification[]>`
    SELECT id, user_id, message, type, read_at, created_at
    FROM notifications
    WHERE user_id = ${userId} AND read_at IS NULL
    ORDER BY created_at ASC
  `;
}

export async function markNotificationsReadForUser(
  userId: string,
  notificationIds: string[],
) {
  if (notificationIds.length === 0) {
    return;
  }

  await ensureNotificationsTable();
  await sql`
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = ${userId}
      AND id IN ${sql(notificationIds)}
  `;
}
