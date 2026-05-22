'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { Button } from '@/app/ui/button';
import { updateUserRole, deleteUser, RegisterState } from '@/app/lib/actions';
import type { User } from '@/app/lib/definitions';

export default function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="w-full">
      <h1 className="mb-8 text-xl md:text-2xl">Users</h1>
      <div className="mt-6 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
            <table className="min-w-full rounded-md text-gray-900 md:table">
              <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                <tr>
                  <th className="px-4 py-5 font-medium">Name</th>
                  <th className="px-3 py-5 font-medium">Email</th>
                  <th className="px-3 py-5 font-medium">Role</th>
                  <th className="px-4 py-5 font-medium sr-only">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-gray-900">
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const initial: RegisterState = { message: null, errors: {} };
  const [updateState, updateAction] = useActionState(updateUserRole, initial as any);
  const [deleteState, deleteAction] = useActionState(deleteUser, '');

  return (
    <tr className="group">
      <td className="whitespace-nowrap py-5 pl-4 pr-3 text-sm">
        <div className="flex items-center gap-3">
          {user.image_url ? (
            <Image src={user.image_url} alt={user.name} width={28} height={28} className="rounded-full" />
          ) : null}
          <p>{user.name}</p>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-5 text-sm">{user.email}</td>
      <td className="whitespace-nowrap px-4 py-5 text-sm">
        <form action={updateAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={user.id} />
          <select name="role" defaultValue={user.role} className="rounded-md border border-gray-200 py-1 px-2 text-sm">
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit">Save</Button>
          {updateState.message && <span className="ml-2 text-sm text-green-600">{updateState.message}</span>}
        </form>
      </td>
      <td className="whitespace-nowrap px-4 py-5 text-sm">
        <form action={deleteAction} className="inline">
          <input type="hidden" name="id" value={user.id} />
          <Button type="submit" className="bg-red-600 hover:bg-red-500">Delete</Button>
        </form>
        {typeof deleteState === 'string' && deleteState && <div className="mt-2 text-sm text-red-600">{deleteState}</div>}
      </td>
    </tr>
  );
}
