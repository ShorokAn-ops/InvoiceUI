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
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Welcome to InvoiceAI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your invoice processing with AI-powered extraction and intelligent management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={stat.title} className={`card-hover animate-fade-in-up gradient-bg border-0 shadow-lg`} style={{animationDelay: `${index * 0.1}s`}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 text-gradient-to-br ${stat.color} bg-clip-text`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.title === 'Total Invoices' && '+12% from last month'}
                  {stat.title === 'Recent Uploads' && 'Last 5 uploads'}
                  {stat.title === 'Unique Vendors' && 'Active suppliers'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 card-hover gradient-bg border-0 shadow-lg animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push('/upload')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload New Invoice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => router.push('/invoices')}
                variant="outline"
                className="flex-1 border-2 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <List className="w-5 h-5 mr-2" />
                View All Invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="card-hover gradient-bg border-0 shadow-lg animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span>Recent Uploads</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No invoices uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-2">Start by uploading your first invoice!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice, index) => (
                  <div
                    key={`${invoice.id}-${index}`}
                    className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200 animate-slide-in"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{invoice.fileName}</p>
                        <p className="text-sm text-muted-foreground">{invoice.vendor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.uploadedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.uploadedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
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