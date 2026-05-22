'use client';
import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import { useActionState } from 'react';
import { resetPassword } from '@/app/lib/actions';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const otpParam = searchParams.get('otp') || '';

  useEffect(() => {
    setEmail(emailParam);
    setOTP(otpParam);
  }, [emailParam, otpParam]);

  const [message, formAction, isPending] = useActionState(resetPassword, undefined);
  const showSuccess =
    typeof message === 'string' && message.includes('successfully');

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData);
    if (message?.includes('successfully')) {
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          Set new password
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your new password below
        </p>
        <div className="w-full space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="otp" value={otp} />

          <div>
            <label
              className="mb-3 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              New Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>

          <div>
            <label
              className="mb-3 block text-xs font-medium text-gray-900"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

        <Button className="mt-4 w-full" aria-disabled={isPending}>
          Reset Password <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
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
