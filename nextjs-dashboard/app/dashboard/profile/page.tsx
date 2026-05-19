import ProfileForm from '@/app/ui/profile/profile-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { auth } from '@/auth';
import postgres from 'postgres';
import type { User } from '@/app/lib/definitions';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
        return user[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export default async function Page() {
    const session = await auth();
    
    if (!session?.user?.email) {
        notFound();
    }

    const user = await getUser(session.user.email);

    if (!user) {
        notFound();
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                { label: 'Profile', href: '/dashboard/profile', active: true },
                ]}
            />
            <ProfileForm user={user} />
        </main>
    );
}
