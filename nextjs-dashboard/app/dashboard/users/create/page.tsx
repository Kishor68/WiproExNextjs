import CreateUserForm from '@/app/ui/dashboard/create-user-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import type { Session } from 'next-auth';

export const metadata: Metadata = {
  title: 'Register User',
};

export default async function Page() {
  const session = await auth();
  const sessionUser = session?.user as Session['user'] & { role?: 'admin' | 'customer' };

  if (!sessionUser?.role || sessionUser.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Register User', href: '/dashboard/users/create', active: true },
        ]}
      />
      <div className="mt-6 w-full max-w-2xl">
        <CreateUserForm />
      </div>
    </main>
  );
}
