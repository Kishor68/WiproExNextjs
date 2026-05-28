 'use client';
import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  UserIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import clsx from 'clsx';
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react';
// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: DocumentDuplicateIcon,
  },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export default function NavLinks({ role }: { role?: string }) {
  const pathname = usePathname();
  // Avoid rendering different classNames between server and client by
  // only applying the "active" class after the component has mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = role === 'admin'
    ? [
        ...links,
        { name: 'Users', href: '/dashboard/users', icon: UserGroupIcon },
        { name: 'Create Customer', href: '/dashboard/customers/create', icon: UserIcon },
        { name: 'Register User', href: '/dashboard/users/create', icon: UserPlusIcon },
      ]
    : links;
  return (
    <>
      {items.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              { 'bg-sky-100 text-blue-600': mounted && pathname === link.href, },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
