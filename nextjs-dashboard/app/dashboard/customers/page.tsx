import { Metadata } from 'next';
import { fetchFilteredCustomers } from '@/app/lib/data';
import CustomersTable from '@/app/ui/customers/table';
import CustomerDetails from '@/app/ui/customers/customer-details';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    customerId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const customerId = searchParams?.customerId;

  const customers = await fetchFilteredCustomers(query);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3">
          <CustomersTable customers={customers} selectedCustomerId={customerId} />
        </div>
        <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
          <div className="sticky top-6">
            {customerId ? (
              <Suspense fallback={<div className="rounded-md bg-gray-50 p-6 flex h-[400px] items-center justify-center text-gray-500">Loading details...</div>}>
                <CustomerDetails customerId={customerId} />
              </Suspense>
            ) : (
              <div className="rounded-md bg-gray-50 p-6 flex h-[400px] items-center justify-center text-gray-500">
                Select a customer to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}