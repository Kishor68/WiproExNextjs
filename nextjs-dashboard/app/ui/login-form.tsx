'use client';
import { useState } from 'react';
import { lusitana } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import { useActionState } from 'react';
import { authenticate, registerUser } from '@/app/lib/actions';
import { useSearchParams } from 'next/navigation';
export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [loginMessage, loginAction, loginPending] = useActionState(
    authenticate,
    undefined,
  );
  const [registerMessage, registerAction, registerPending] = useActionState(
    registerUser,
    undefined,
  );

  const isPending = mode === 'register' ? registerPending : loginPending;
  const action = mode === 'register' ? registerAction : loginAction;
  const message = mode === 'register' ? registerMessage : loginMessage;
  const showSuccess =
    mode === 'register' &&
    typeof registerMessage === 'string' &&
    registerMessage.includes('successful');

  return (
    <form action={action} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          {mode === 'register'
            ? 'Create a new account.'
            : 'Please log in to continue.'}
        </h1>
        {mode === 'register' && (
          <div>
            <label
              className="mb-3 block text-xs font-medium text-gray-900"
              htmlFor="name"
            >
              Name
            </label>
            <input
              className="block w-full rounded-md border border-gray-200 py-[9px] px-3 text-sm outline-2 placeholder:text-gray-500"
              id="name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              required
            />
          </div>
        )}
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        {mode === 'register' && (
          <div className="mt-4">
            <label
              className="mb-3 block text-xs font-medium text-gray-900"
              htmlFor="profilePicture"
            >
              Profile Picture
            </label>
            <input
              className="block w-full rounded-md border border-gray-200 bg-white py-[9px] px-3 text-sm outline-2 file:mr-4 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:text-white"
              id="profilePicture"
              type="file"
              name="image"
              accept="image/*"
            />
          </div>
        )}
        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button className="mt-4 w-full" aria-disabled={isPending}>
          {mode === 'register' ? 'Register' : 'Log in'}{' '}
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {message && (
            <>
              {showSuccess ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              )}
              <p
                className={`text-sm ${
                  showSuccess ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {message}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {mode === 'register'
            ? 'Already have an account? Log in'
            : 'Need an account? Register'}
        </button>
      </div>
    </form>
  );
}
