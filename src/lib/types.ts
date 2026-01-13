export interface InvoiceMetadata {
  id: string;
  vendor: string;
  fileName: string;
  uploadedAt: string;
}

export interface InvoiceData {
  InvoiceId: string;
  VendorName: string;
  InvoiceDate: string;
  BillingAddressRecipient: string;
  ShippingAddress: string;
  SubTotal: number;
  ShippingCost: number;
  InvoiceTotal: number;
  Items: {
    Description: string;
    Name: string;
    Quantity: number;
    UnitPrice: number;
    Amount: number;
  }[];
}