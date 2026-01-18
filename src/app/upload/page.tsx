'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceMetadata } from '@/lib/types';
import { computeFileHash } from '@/lib/utils';
import { Upload, FileText, CloudUpload, CheckCircle, Eye, ArrowRight } from 'lucide-react';

const API_BASE = '/api';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      router.push('/login');
    }
  }, [router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type. Please upload PDF or image files.');
        return;
      }
      setFile(selectedFile);
      setExtractedData(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    // Pre-check duplicates by file hash before sending
    try {
      const hash = await computeFileHash(file);
      const existing: InvoiceMetadata[] = JSON.parse(localStorage.getItem('invoices') || '[]');
      const dup = existing.find(inv =>
        inv.hash === hash ||
        (!inv.hash && inv.fileName === file.name && (inv.size === undefined || inv.size === file.size))
      );
      if (dup) {
        toast.error('Duplicate invoice detected. This file was already uploaded.');
        setUploading(false);
        return;
      }
      // Attach hash to metadata after extraction
      (formData as any)._fileHash = hash; // marker kept locally
    } catch (e) {
      // If hashing fails, continue but rely on InvoiceId check later
    }

    try {
      const response = await axios.post(`${API_BASE}/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      setExtractedData(data);

      // Save to localStorage
      const invoices: InvoiceMetadata[] = JSON.parse(localStorage.getItem('invoices') || '[]');
      const metadata: InvoiceMetadata = {
        id: data.data.InvoiceId || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vendor: data.data.VendorName || 'Unknown',
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        hash: (formData as any)._fileHash,
        size: file.size,
      };
      // Prevent duplicate by id or hash before saving
      const alreadyExists = invoices.some(inv =>
        inv.id === metadata.id ||
        (metadata.hash && inv.hash === metadata.hash) ||
        (!metadata.hash && !inv.hash && inv.fileName === metadata.fileName && (inv.size === undefined || inv.size === metadata.size))
      );
      if (alreadyExists) {
        toast.error('Duplicate invoice detected. Skipping save.');
      } else {
        invoices.push(metadata);
        localStorage.setItem('invoices', JSON.stringify(invoices));
        toast.success('Invoice uploaded and processed successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = () => {
    if (extractedData?.data?.InvoiceId) {
      router.push(`/invoice/${extractedData.data.InvoiceId}`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toaster />

        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Upload Invoice
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your invoice documents and let AI extract all the important information automatically
          </p>
        </div>

        <Card className="mb-8 card-hover gradient-bg border-0 shadow-xl animate-fade-in-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center space-x-2">
              <Upload className="w-6 h-6 text-blue-600" />
              <span>File Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              {...getRootProps()}
              className={`upload-zone border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive ? 'drag-active scale-105' : ''
              } ${file ? 'border-green-400 bg-green-50/50' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                {file ? (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-700">File Selected!</p>
                      <p className="text-green-600">{file.name}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : isDragActive ? (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-blue-700">Drop your file here!</p>
                      <p className="text-blue-600">Release to upload your invoice</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-float">
                      <CloudUpload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-foreground">Drag & drop your invoice</p>
                      <p className="text-muted-foreground">or click to browse files</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supports PDF, PNG, JPG, JPEG, WebP files
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-3 text-lg"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload & Extract Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {extractedData && (
          <Card className="card-hover gradient-bg border-0 shadow-xl animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span>Extraction Complete!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/50 rounded-lg p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Extracted Invoice Data</h3>
                <pre className="bg-muted/50 p-4 rounded overflow-auto text-sm border border-white/10">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleViewDetails}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Full Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}