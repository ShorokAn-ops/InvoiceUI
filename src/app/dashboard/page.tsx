'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceMetadata } from '@/lib/types';
import { FileText, Upload, Users, TrendingUp, ArrowRight, Clock, List, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceMetadata[]>([]);
  const [uniqueVendors, setUniqueVendors] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
      return;
    }

    const invoices: InvoiceMetadata[] = JSON.parse(localStorage.getItem('invoices') || '[]');
    setTotalInvoices(invoices.length);
    setRecentInvoices(invoices.slice(-5).reverse());
    const vendors = new Set(invoices.map(inv => inv.vendor));
    setUniqueVendors(vendors.size);
  }, [router]);

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const invoices: InvoiceMetadata[] = JSON.parse(localStorage.getItem('invoices') || '[]');
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      // Update state
      setTotalInvoices(updatedInvoices.length);
      setRecentInvoices(updatedInvoices.slice(-5).reverse());
      const vendors = new Set(updatedInvoices.map(inv => inv.vendor));
      setUniqueVendors(vendors.size);
      
      toast.success('Invoice deleted successfully');
    }
  };

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-500/10 to-blue-600/10'
    },
    {
      title: 'Recent Uploads',
      value: recentInvoices.length,
      icon: Upload,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-500/10 to-green-600/10'
    },
    {
      title: 'Unique Vendors',
      value: uniqueVendors,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-500/10 to-purple-600/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Welcome to InvoiceAI
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Streamline your invoice processing with AI-powered extraction and intelligent management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-5xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <p className="text-sm text-gray-500">
                  {stat.title === 'Total Invoices' && '+12% from last month'}
                  {stat.title === 'Recent Uploads' && 'Last 5 uploads'}
                  {stat.title === 'Unique Vendors' && 'Active suppliers'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-16 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push('/upload')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-14 text-base font-semibold"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload New Invoice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => router.push('/invoices')}
                variant="outline"
                className="flex-1 border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 transition-all duration-300 hover:-translate-y-1 h-14 text-base font-semibold"
              >
                <List className="w-5 h-5 mr-2" />
                View All Invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">Recent Uploads</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 text-xl font-semibold mb-2">No invoices uploaded yet</p>
                <p className="text-sm text-gray-500">Start by uploading your first invoice!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice, index) => (
                  <div
                    key={`${invoice.id}-${index}`}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl hover:shadow-lg transition-all duration-200 border border-gray-100"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-base">{invoice.fileName}</p>
                        <p className="text-sm text-gray-500 font-medium">{invoice.vendor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-medium">
                          {new Date(invoice.uploadedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(invoice.uploadedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}