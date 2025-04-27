'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import Button from '@/components/ui/Button';
import { FiUpload, FiDownload, FiFile, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { Product, ProductVariant } from '@/lib/types';

interface ProductImportExportProps {
  onImportComplete: () => void;
}

export default function ProductImportExport({ onImportComplete }: ProductImportExportProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    totalProducts: number;
    newProducts: number;
    updatedProducts: number;
    sampleProducts: Product[];
  } | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setSelectedFile(file);
    previewImport(file);
  };

  // Preview the import file
  const previewImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());

      // Check required headers
      const requiredHeaders = ['name', 'price', 'category'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

      if (missingHeaders.length > 0) {
        showToast(`Missing required headers: ${missingHeaders.join(', ')}`, 'error');
        setSelectedFile(null);
        return;
      }

      // Parse a few products for preview
      const sampleProducts: Product[] = [];
      const productCount = Math.min(5, lines.length - 1);

      for (let i = 1; i <= productCount; i++) {
        if (!lines[i] || lines[i].trim() === '') continue;

        const values = parseCSVLine(lines[i]);
        const product: Partial<Product> = {};

        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            // Handle specific field types
            if (header === 'price' || header === 'salePrice') {
              product[header as keyof Product] = parseFloat(values[index]) as any;
            } else if (header === 'isNew' || header === 'isSale' || header === 'isFeatured' || header === 'trackInventory') {
              product[header as keyof Product] = (values[index].toLowerCase() === 'true') as any;
            } else if (header === 'stock' || header === 'rating' || header === 'reviewCount') {
              product[header as keyof Product] = parseInt(values[index], 10) as any;
            } else if (header === 'colors' || header === 'sizes' || header === 'tags' || header === 'images') {
              product[header as keyof Product] = values[index].split('|').map(item => item.trim()) as any;
            } else {
              product[header as keyof Product] = values[index] as any;
            }
          }
        });

        if (product.name && product.price !== undefined && product.category) {
          sampleProducts.push(product as Product);
        }
      }

      setImportPreview({
        totalProducts: lines.length - 1,
        newProducts: Math.floor((lines.length - 1) * 0.7), // Estimate for preview
        updatedProducts: Math.floor((lines.length - 1) * 0.3), // Estimate for preview
        sampleProducts
      });

      setShowConfirmation(true);
    } catch (error) {
      console.error('Error previewing import:', error);
      showToast('Error previewing file. Please check the file format.', 'error');
    }
  };

  // Parse CSV line handling quotes and commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  // Handle import confirmation
  const confirmImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import products');
      }

      const result = await response.json();
      showToast(`Successfully imported ${result.imported} products`, 'success');
      setSelectedFile(null);
      setShowConfirmation(false);
      onImportComplete();
    } catch (error) {
      console.error('Error importing products:', error);
      showToast('Error importing products', 'error');
    } finally {
      setIsUploading(false);
      setImportProgress(100);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/admin/products/export', {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export products');
      }

      // Get the CSV data
      const csvData = await response.text();

      // Create a blob and download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Products exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting products:', error);
      showToast('Error exporting products', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Simulate progress for better UX
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isUploading && importProgress < 90) {
      interval = setInterval(() => {
        setImportProgress(prev => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 90);
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUploading, importProgress]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Import/Export Products</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="text-md font-medium text-gray-800 mb-2">Import Products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file to import products. The file should include columns for name, price, and category.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}>
              <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to select a CSV file</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FiFile className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setShowConfirmation(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                  <p className="text-xs text-gray-500 text-right mt-1">{Math.round(importProgress)}%</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mr-2"
              disabled={isUploading}
            >
              Select File
            </Button>
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={!selectedFile || isUploading || showConfirmation}
            >
              Import Products
            </Button>
          </div>
        </div>

        {/* Export Section */}
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="text-md font-medium text-gray-800 mb-2">Export Products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download all products as a CSV file. This file can be edited and re-imported.
          </p>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50"
            onClick={handleExport}>
            <FiDownload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to export all products</p>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleExport}
              isLoading={isExporting}
              loadingText="Exporting..."
            >
              Export Products
            </Button>
          </div>
        </div>
      </div>

      {/* Import Confirmation Modal */}
      {showConfirmation && importPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center text-gray-800 mb-4">
              <FiAlertTriangle className="h-6 w-6 mr-2 text-yellow-500" />
              <h3 className="text-lg font-medium">Confirm Import</h3>
            </div>
            
            <div className="mb-4">
              <p className="mb-2">
                You are about to import <strong>{importPreview.totalProducts}</strong> products:
              </p>
              <ul className="list-disc pl-5 mb-4 text-sm">
                <li>Approximately {importPreview.newProducts} new products will be created</li>
                <li>Approximately {importPreview.updatedProducts} existing products will be updated</li>
              </ul>
              
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <h4 className="text-sm font-medium mb-2">Sample of products to be imported:</h4>
                <div className="max-h-40 overflow-y-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Price</th>
                        <th className="px-2 py-1 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.sampleProducts.map((product, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="px-2 py-1">{product.name}</td>
                          <td className="px-2 py-1">${product.price}</td>
                          <td className="px-2 py-1">{product.categoryName || product.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                This operation may take some time depending on the number of products.
                Do you want to proceed?
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmImport}
                isLoading={isUploading}
                loadingText="Importing..."
              >
                Confirm Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Format Help */}
      <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">CSV Format Guidelines</h3>
        <ul className="text-sm text-blue-800 list-disc pl-5 space-y-1">
          <li>Required columns: name, price, category</li>
          <li>Optional columns: description, image, images, colors, sizes, tags, isNew, isSale, isFeatured, salePrice, stock, sku, barcode</li>
          <li>For multiple values (colors, sizes, tags, images), separate with a pipe character (|)</li>
          <li>Boolean values should be 'true' or 'false'</li>
          <li>First row must contain column headers</li>
        </ul>
      </div>
    </div>
  );
}