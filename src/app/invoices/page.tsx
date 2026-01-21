'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceMetadata, InvoiceData } from '@/lib/types';
import { Trash2 } from 'lucide-react';

// Use /api to reach Next.js API routes
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function InvoicesPage() {
  const [localInvoices, setLocalInvoices] = useState<InvoiceMetadata[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorInvoices, setVendorInvoices] = useState<InvoiceData[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
      return;
    }
    const invoices: InvoiceMetadata[] = JSON.parse(localStorage.getItem('invoices') || '[]');
    setLocalInvoices(invoices);
  }, [router]);

  const handleVendorSearch = async () => {
    if (!vendorSearch.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get(`${API_BASE}/invoices/vendor/${encodeURIComponent(vendorSearch)}`);
      setVendorInvoices(response.data.invoices || []);
    } catch (error: any) {
      toast.error('Failed to fetch vendor invoices');
      setVendorInvoices([]);
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const invoices: InvoiceMetadata[] = JSON.parse(localStorage.getItem('invoices') || '[]');
      const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '{}');
      
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      delete invoiceData[invoiceId];
      
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
      setLocalInvoices(updatedInvoices);
      toast.success('Invoice deleted successfully');
    }
  };

  const handleDeleteVendorInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice from the search results?')) {
      setVendorInvoices(vendorInvoices.filter(inv => inv.InvoiceId !== invoiceId));
      toast.success('Invoice removed from search results');
    }
  };

  const sortedLocalInvoices = [...localInvoices].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster />
      <h1 className="text-3xl font-bold text-foreground mb-8">Invoices</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vendor Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter vendor name"
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVendorSearch()}
            />
            <Button onClick={handleVendorSearch} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {vendorInvoices.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invoices for Vendor: {vendorSearch}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorInvoices.map((invoice, index) => (
                  <TableRow key={`${invoice.InvoiceId}-${index}`}>
                    <TableCell>{invoice.InvoiceId}</TableCell>
                    <TableCell>{invoice.VendorName}</TableCell>
                    <TableCell>{invoice.InvoiceDate}</TableCell>
                    <TableCell>${invoice.InvoiceTotal?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/invoice/${invoice.InvoiceId}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteVendorInvoice(invoice.InvoiceId)}
                          className="text-white hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Local History</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedLocalInvoices.length === 0 ? (
            <p className="text-muted-foreground">No invoices uploaded yet. <Button variant="link" onClick={() => router.push('/upload')}>Upload now</Button></p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Uploaded Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLocalInvoices.map((invoice, index) => (
                  <TableRow key={`${invoice.id}-${index}`}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.vendor}</TableCell>
                    <TableCell>{invoice.fileName}</TableCell>
                    <TableCell>{new Date(invoice.uploadedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/invoice/${invoice.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-white hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}