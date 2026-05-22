import VerifyOTPForm from '@/app/ui/verify-otp-form';
import AcmeLogo from '@/app/ui/acme-logo';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Verify OTP',
};

export default function VerifyOTPPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <Suspense fallback={<div className="text-center text-sm text-gray-500">Loading...</div>}>
        <VerifyOTPForm />
          </Suspense>
      </div>
    </main>
  );
}
