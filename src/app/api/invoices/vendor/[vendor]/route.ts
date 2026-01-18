import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Params = { params: { vendor: string } };

function mockInvoicesForVendor(vendor: string) {
  const today = new Date().toISOString().split('T')[0];
  const makeId = (suffix: string) => `inv-${suffix}-${Math.random().toString(36).slice(2, 6)}`;
  return [
    {
      InvoiceId: makeId('001'),
      VendorName: vendor,
      InvoiceDate: today,
      BillingAddressRecipient: `${vendor} Billing`,
      ShippingAddress: '123 Market St, Metropolis',
      SubTotal: 150,
      ShippingCost: 0,
      InvoiceTotal: 150,
      Items: [
        { Description: 'Subscription', Name: 'SaaS Plan', Quantity: 1, UnitPrice: 150, Amount: 150 },
      ],
    },
    {
      InvoiceId: makeId('002'),
      VendorName: vendor,
      InvoiceDate: today,
      BillingAddressRecipient: `${vendor} Billing`,
      ShippingAddress: '123 Market St, Metropolis',
      SubTotal: 89.99,
      ShippingCost: 0,
      InvoiceTotal: 89.99,
      Items: [
        { Description: 'License', Name: 'Pro License', Quantity: 1, UnitPrice: 89.99, Amount: 89.99 },
      ],
    },
  ];
}

export async function GET(req: Request, { params }: Params) {
  const vendor = params.vendor;
  if (!vendor) {
    return NextResponse.json({ detail: 'Missing vendor param' }, { status: 400 });
  }
  const invoices = mockInvoicesForVendor(decodeURIComponent(vendor));
  return NextResponse.json({ invoices }, { status: 200 });
}
