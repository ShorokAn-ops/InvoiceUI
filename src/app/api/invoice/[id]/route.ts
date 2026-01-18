import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Params = { params: { id: string } };

function buildInvoice(id: string) {
  const today = new Date().toISOString().split('T')[0];
  return {
    InvoiceId: id,
    VendorName: 'Sample Vendor Co.',
    InvoiceDate: today,
    BillingAddressRecipient: 'Accounts Payable, Sample Vendor Co.',
    ShippingAddress: '123 Main St, Springfield, USA',
    SubTotal: 200,
    ShippingCost: 0,
    InvoiceTotal: 200,
    Items: [
      { Description: 'Service A', Name: 'Consulting', Quantity: 2, UnitPrice: 50, Amount: 100 },
      { Description: 'Service B', Name: 'Implementation', Quantity: 2, UnitPrice: 50, Amount: 100 },
    ],
  };
}

export async function GET(req: Request, { params }: Params) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ detail: 'Missing invoice id' }, { status: 400 });
  }
  const invoice = buildInvoice(id);
  return NextResponse.json(invoice, { status: 200 });
}
