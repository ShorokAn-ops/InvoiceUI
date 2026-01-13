'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { FileText, Upload, List, LogOut, Home } from 'lucide-react';

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isLoggedIn) return null;

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse-glow">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              InvoiceAI
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-foreground hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/upload"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-foreground hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link
              href="/invoices"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-foreground hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <List className="w-4 h-4" />
              <span>Invoices</span>
            </Link>
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 hover:scale-105"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}