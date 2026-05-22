'use client';
import { useState } from 'react';
import { lusitana } from '@/app/ui/fonts';
import { AtSymbolIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import { useActionState } from 'react';
import { requestPasswordReset } from '@/app/lib/actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const [message, formAction, isPending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData);
    // Redirect to OTP page after requesting reset
    setTimeout(() => {
      router.push(`/forgot-password/verify-otp?email=${email}`);
    }, 1500);
  };

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          Reset your password
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
        <div className="w-full">
          <label
            className="mb-3 block text-xs font-medium text-gray-900"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>
        <Button className="mt-4 w-full" aria-disabled={isPending}>
          Send OTP <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {message && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-blue-500">{message}</p>
            </>
          )}
        </div>
        <Link
          href="/login"
          className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}
