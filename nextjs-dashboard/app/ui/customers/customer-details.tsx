import Image from 'next/image';
import { fetchCustomerById, fetchCustomerInvoices } from '@/app/lib/data';
import { formatCurrency, formatDateToLocal } from '@/app/lib/utils';
import { lusitana } from '@/app/ui/fonts';
import InvoiceStatus from '@/app/ui/invoices/status';

export default async function CustomerDetails({ customerId }: { customerId: string }) {
  const [customer, invoices] = await Promise.all([
    fetchCustomerById(customerId),
    fetchCustomerInvoices(customerId),
  ]);

  if (!customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-md bg-gray-50 p-6">
        <p className="text-gray-500">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-gray-50 p-6 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={customer.image_url}
            className="rounded-full"
            alt={`${customer.name}'s profile picture`}
            width={64}
            height={64}
          />
          <div>
            <h2 className={`${lusitana.className} text-2xl font-semibold`}>
              {customer.name}
            </h2>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-xl font-medium text-red-500">
            {customer.total_pending}
          </p>
        </div>
      </div>

      <h3 className={`${lusitana.className} mb-4 text-xl`}>Recent Invoices</h3>
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices found for this customer.</p>
      ) : (
        <div className="overflow-hidden rounded-md bg-white shadow-sm">
          <div className="md:hidden">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border-b p-4 last:border-b-0">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{formatDateToLocal(invoice.date)}</p>
                  <InvoiceStatus status={invoice.status} />
                </div>
                <p className="text-lg font-medium">{formatCurrency(invoice.amount)}</p>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="border-b bg-gray-50 text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium sm:pl-6">
                  Amount
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="whitespace-nowrap px-4 py-3 sm:pl-6 text-lg font-medium">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                    {formatDateToLocal(invoice.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    <InvoiceStatus status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
