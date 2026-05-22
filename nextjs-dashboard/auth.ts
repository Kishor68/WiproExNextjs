import NextAuth from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import type { Session } from 'next-auth';
import { authConfig } from './auth.config';
import { z } from 'zod';
import Credentials from 'next-auth/providers/credentials';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

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

type AuthToken = { id?: string; role?: 'admin' | 'customer' } & Record<string, any>;
type AuthSession = Session & {
    user: Session['user'] & { id?: string; role?: 'admin' | 'customer' };
};

const nextAuthHandler = NextAuth({
    ...authConfig,
    providers: [Credentials({
        async authorize(credentials) {
            const parsedCredentials = z
                .object({ email: z.string().email(), password: z.string().min(6) })
                .safeParse(credentials);
            if (parsedCredentials.success) {
                const { email, password } = parsedCredentials.data;
                const user = await getUser(email);
                if (!user) return null;
                const passwordsMatch = await bcrypt.compare(password, user.password);
                if (passwordsMatch) return user;
            }
            console.log('Invalid credentials');
            return null;
        },
    }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = ('role' in user ? user.role : undefined) ?? 'customer';
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
});

export const { auth, signIn, signOut } = nextAuthHandler;
