'use client';

import { useActionState } from 'react';
import {
  UserCircleIcon,
  AtSymbolIcon,
  KeyIcon,
  IdentificationIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createDashboardUser, RegisterState } from '@/app/lib/actions';

export default function CreateUserForm() {
  const initialState: RegisterState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createDashboardUser, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4 text-sm text-gray-600">
          Register a new user and assign them either an admin or customer role.
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Full Name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter full name"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="name-error"
            />
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name?.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="email-error"
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email?.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="password-error"
              minLength={6}
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="password-error" aria-live="polite" aria-atomic="true">
            {state.errors?.password?.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="role" className="mb-2 block text-sm font-medium">
            Role
          </label>
          <div className="relative">
            <select
              id="role"
              name="role"
              className="peer block w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="role-error"
              defaultValue="customer"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="role-error" aria-live="polite" aria-atomic="true">
            {state.errors?.role?.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="image" className="mb-2 block text-sm font-medium">
            Profile Image (Optional)
          </label>
          <div className="relative">
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            />
            <PhotoIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>
      </div>

      {state.message && (
        <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
          {state.message}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button type="submit">Register User</Button>
      </div>
    </form>
  );
}
