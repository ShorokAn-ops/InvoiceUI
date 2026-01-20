'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceData } from '@/lib/types';

// Prefer env-configured base to avoid conflicts with local Next.js routes
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/backend';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<InvoiceData>>({});
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
      return;
    }
    if (id) {
      fetchInvoice(id as string);
    }
  }, [id, router]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/invoice/${invoiceId}`);
      setInvoice(response.data);
      setEditedData(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // UI only save
    setInvoice({ ...invoice, ...editedData } as InvoiceData);
    setEditing(false);
    toast.success('Changes saved locally');
  };

  const handleDownloadJSON = () => {
    if (invoice) {
      const dataStr = JSON.stringify(invoice, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `invoice-${invoice.InvoiceId}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>;
  }

  if (!invoice) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Invoice not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Invoice Details</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrint} variant="outline">Print</Button>
          <Button onClick={handleDownloadJSON} variant="outline">Download JSON</Button>
          <Button onClick={() => router.push('/invoices')} variant="outline">Back to Invoices</Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Vendor Name</label>
              {editing ? (
                <Input
                  value={editedData.VendorName || ''}
                  onChange={(e) => setEditedData({ ...editedData, VendorName: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{invoice.VendorName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Invoice ID</label>
              {editing ? (
                <Input
                  value={editedData.InvoiceId || ''}
                  onChange={(e) => setEditedData({ ...editedData, InvoiceId: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{invoice.InvoiceId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Invoice Date</label>
              {editing ? (
                <Input
                  type="date"
                  value={editedData.InvoiceDate || ''}
                  onChange={(e) => setEditedData({ ...editedData, InvoiceDate: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{invoice.InvoiceDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Invoice Total</label>
              {editing ? (
                <Input
                  type="number"
                  value={editedData.InvoiceTotal || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEditedData({ ...editedData, InvoiceTotal: isNaN(val) ? 0 : val });
                  }}
                />
              ) : (
                <p className="text-foreground">${invoice.InvoiceTotal?.toFixed(2)}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Billing Address</label>
            {editing ? (
              <Textarea
                value={editedData.BillingAddressRecipient || ''}
                onChange={(e) => setEditedData({ ...editedData, BillingAddressRecipient: e.target.value })}
              />
            ) : (
              <p className="text-foreground">{invoice.BillingAddressRecipient}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Shipping Address</label>
            {editing ? (
              <Textarea
                value={editedData.ShippingAddress || ''}
                onChange={(e) => setEditedData({ ...editedData, ShippingAddress: e.target.value })}
              />
            ) : (
              <p className="text-foreground">{invoice.ShippingAddress}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {editing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => { setEditing(false); setEditedData(invoice); }}>Cancel</Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.Items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.Description}</TableCell>
                  <TableCell>{item.Name}</TableCell>
                  <TableCell>{item.Quantity}</TableCell>
                  <TableCell>${item.UnitPrice?.toFixed(2)}</TableCell>
                  <TableCell>${item.Amount?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}