import { auth } from '@/auth';
import {
  fetchUnreadNotificationsForUser,
  markNotificationsReadForUser,
} from '@/app/lib/notifications';

type SessionUserWithId = {
  id?: string;
};

function getSessionUserId(session: unknown) {
  return (
    session as
      | {
          user?: SessionUserWithId;
        }
      | null
      | undefined
  )?.user?.id;
}

export async function GET() {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    return Response.json({ notifications: [] });
  }

  const notifications = await fetchUnreadNotificationsForUser(userId);

  return Response.json({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      message: notification.message,
      type: notification.type,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json()) as { ids?: unknown };
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === 'string')
    : [];

  await markNotificationsReadForUser(userId, ids);

  return Response.json({ ok: true });
}
