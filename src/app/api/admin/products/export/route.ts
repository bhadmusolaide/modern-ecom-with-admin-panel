import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    // In a real application, we would check authentication here
    // For now, we'll skip authentication for the demo

    // Get all products from Firestore
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const products: Product[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));

    // Define CSV headers
    const headers = [
      'id',
      'name',
      'price',
      'salePrice',
      'description',
      'category',
      'categoryName',
      'image',
      'images',
      'colors',
      'sizes',
      'tags',
      'isNew',
      'isSale',
      'isFeatured',
      'stock',
      'sku',
      'barcode',
      'trackInventory',
      'lowStockThreshold',
      'rating',
      'reviewCount',
      'hasVariants',
      'createdAt',
      'updatedAt'
    ];

    // Convert products to CSV rows
    const rows = products.map(product => {
      const row: Record<string, string> = {};
      
      headers.forEach(header => {
        const key = header as keyof Product;
        const value = product[key];
        
        if (value === undefined || value === null) {
          row[header] = '';
        } else if (Array.isArray(value)) {
          row[header] = value.join('|');
        } else if (typeof value === 'object') {
          row[header] = JSON.stringify(value);
        } else {
          row[header] = String(value);
        }
      });
      
      return row;
    });

    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or newline
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    // Return CSV as response
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 });
  }
}