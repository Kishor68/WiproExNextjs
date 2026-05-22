import UsersTable from '@/app/ui/dashboard/users-table';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { fetchAllUsers } from '@/app/lib/data';
import type { Session } from 'next-auth';

export const metadata: Metadata = {
  title: 'Users',
};

export default async function Page() {
  const session = await auth();
  const sessionUser = session?.user as Session['user'] & { role?: 'admin' | 'customer' };

  if (!sessionUser?.role || sessionUser.role !== 'admin') {
    redirect('/dashboard');
  }

  const users = await fetchAllUsers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Users', href: '/dashboard/users', active: true },
        ]}
      />
      <div className="mt-6 w-full">
        {/* @ts-expect-error Server -> Client */}
        <UsersTable users={users} />
      </div>
    </main>
  );
}
