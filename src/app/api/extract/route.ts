import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function generateMockInvoice() {
  const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().split('T')[0];
  return {
    InvoiceId: id,
    VendorName: 'Sample Vendor Co.',
    InvoiceDate: today,
    BillingAddressRecipient: 'Accounts Payable, Sample Vendor Co.',
    ShippingAddress: '123 Main St, Springfield, USA',
    SubTotal: 123.45,
    ShippingCost: 0,
    InvoiceTotal: 123.45,
    Items: [
      {
        Description: 'Consulting services',
        Name: 'Professional Services',
        Quantity: 1,
        UnitPrice: 120,
        Amount: 120,
      },
      {
        Description: 'Tax',
        Name: 'Sales Tax',
        Quantity: 1,
        UnitPrice: 3.45,
        Amount: 3.45,
      },
    ],
  };
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ detail: 'Content-Type must be multipart/form-data' }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ detail: 'Missing file field' }, { status: 400 });
  }

  // In a real implementation, process the file here.
  const mock = generateMockInvoice();

  return NextResponse.json({ message: 'Extraction successful', data: mock }, { status: 200 });
}
