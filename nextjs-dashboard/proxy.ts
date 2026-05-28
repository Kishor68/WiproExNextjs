import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    // Exclude API/_next and common static/PWA assets so they are served directly
    matcher: ['/((?!api|_next/static|_next/image|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)'],
};