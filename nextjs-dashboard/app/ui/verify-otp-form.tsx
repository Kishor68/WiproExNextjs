'use client';
import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from './button';
import { useActionState } from 'react';
import { verifyOTP } from '@/app/lib/actions';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyOTPForm() {
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  useEffect(() => {
    setEmail(emailParam);
  }, [emailParam]);

  const [message, formAction, isPending] = useActionState(verifyOTP, undefined);
  const showSuccess =
    typeof message === 'string' && message.includes('successfully');

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData);
    if (message?.includes('successfully')) {
      setTimeout(() => {
        router.push(`/forgot-password/reset?email=${email}&otp=${otp}`);
      }, 1500);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          Enter your OTP
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          We've sent a 6-digit code to {email}
        </p>
        <div className="w-full">
          <input type="hidden" name="email" value={email} />
          <label
            className="mb-3 block text-xs font-medium text-gray-900"
            htmlFor="otp"
          >
            OTP Code
          </label>
          <input
            className="block w-full rounded-md border border-gray-200 py-[9px] px-3 text-center text-2xl tracking-widest outline-2 placeholder:text-gray-500"
            id="otp"
            type="text"
            name="otp"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
          />
        </div>
        <Button className="mt-4 w-full" aria-disabled={isPending}>
          Verify OTP <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
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
          href="/forgot-password"
          className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Request a new OTP
        </Link>
      </div>
    </form>
  );
}
