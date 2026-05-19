'use client';

import { User } from '@/app/lib/definitions';
import { updateProfile, State } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';
import { UserCircleIcon, KeyIcon, AtSymbolIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function ProfileForm({ user }: { user: User }) {
  const initialState: State = { message: null, errors: {} };
  const updateProfileWithId = updateProfile.bind(null, user.id);
  const [state, dispatch] = useActionState(updateProfileWithId, initialState);

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-6 flex items-center justify-center">
          {user.image_url ? (
            <Image
              src={user.image_url}
              className="rounded-full border-4 border-white shadow-lg"
              alt={`${user.name}'s profile picture`}
              width={120}
              height={120}
            />
          ) : (
            <UserCircleIcon className="h-32 w-32 text-gray-300" />
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Username
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              placeholder="Enter your username"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              required
            />
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder="Enter your email address"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              required
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            New Password (leave blank to keep current)
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>

        {/* About */}
        <div className="mb-4">
          <label htmlFor="about" className="mb-2 block text-sm font-medium">
            About Me
          </label>
          <div className="relative">
            <textarea
              id="about"
              name="about"
              defaultValue={user.about || ''}
              placeholder="Tell us about yourself"
              rows={4}
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            />
            <ChatBubbleBottomCenterTextIcon className="pointer-events-none absolute left-3 top-4 h-[18px] w-[18px] text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>

        {state.message && (
          <p className="mt-2 text-sm text-green-500">
            {state.message}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button type="submit">Update Profile</Button>
      </div>
    </form>
  );
}
