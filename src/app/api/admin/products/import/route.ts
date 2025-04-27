import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDoc, setDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product, Category } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // In a real application, we would check authentication here
    // For now, we'll skip authentication for the demo

    // Get form data with the CSV file
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file content
    const text = await file.text();
    const lines = text.split('\n');
    
    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Check required headers
    const requiredHeaders = ['name', 'price', 'category'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    // Fetch all categories for reference
    const categoriesRef = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesRef);
    const categories: Record<string, Category> = {};
    
    categoriesSnapshot.docs.forEach(doc => {
      const category = doc.data() as Category;
      categories[doc.id] = category;
      // Also index by name for lookup
      if (category.name) {
        categories[category.name.toLowerCase()] = {
          ...category,
          id: doc.id
        };
      }
    });

    // Process products in batches to avoid Firestore limits
    const batchSize = 500;
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = 0; i < Math.ceil((lines.length - 1) / batchSize); i++) {
      const batch = writeBatch(db);
      const startIdx = i * batchSize + 1; // Skip header row
      const endIdx = Math.min(startIdx + batchSize, lines.length);
      
      for (let j = startIdx; j < endIdx; j++) {
        const line = lines[j].trim();
        if (!line) continue;
        
        try {
          // Parse CSV line
          const values = parseCSVLine(line);
          const productData: Partial<Product> = {};
          
          // Map values to product fields
          headers.forEach((header, index) => {
            if (values[index] !== undefined) {
              const value = values[index].trim();
              
              // Skip empty values
              if (value === '') return;
              
              // Handle specific field types
              if (header === 'price' || header === 'salePrice' || header === 'rating' || 
                  header === 'stock' || header === 'lowStockThreshold' || header === 'reviewCount') {
                productData[header as keyof Product] = parseFloat(value) as any;
              } 
              else if (header === 'isNew' || header === 'isSale' || header === 'isFeatured' || 
                       header === 'trackInventory' || header === 'hasVariants') {
                productData[header as keyof Product] = (value.toLowerCase() === 'true') as any;
              } 
              else if (header === 'colors' || header === 'sizes' || header === 'tags' || header === 'images') {
                productData[header as keyof Product] = value.split('|').map(item => item.trim()) as any;
              } 
              else if (header === 'variants') {
                try {
                  productData[header as keyof Product] = JSON.parse(value) as any;
                } catch (e) {
                  console.error('Error parsing variants JSON:', e);
                }
              }
              else {
                productData[header as keyof Product] = value as any;
              }
            }
          });
          
          // Validate required fields
          if (!productData.name || productData.price === undefined || !productData.category) {
            throw new Error('Missing required fields: name, price, or category');
          }
          
          // Handle category mapping
          if (productData.category) {
            const categoryKey = productData.category.toString().toLowerCase();
            if (categories[categoryKey]) {
              productData.category = categories[categoryKey].id;
              productData.categoryName = categories[categoryKey].name;
            }
          }
          
          // Set default values
          if (!productData.image && productData.images && productData.images.length > 0) {
            productData.image = productData.images[0];
          }
          
          // Generate ID if not provided
          const productId = productData.id || `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          delete productData.id; // Remove id from data to avoid duplication
          
          // Add timestamps
          const now = new Date().toISOString();
          if (!productData.createdAt) {
            productData.createdAt = now;
          }
          productData.updatedAt = now;
          
          // Add to batch
          const productRef = doc(db, 'products', productId);
          
          // Check if product exists to count as update or new
          const productDoc = await getDoc(productRef);
          if (productDoc.exists()) {
            updatedCount++;
          } else {
            importedCount++;
          }
          
          batch.set(productRef, productData);
        } catch (error) {
          console.error(`Error processing line ${j}:`, error);
          errorCount++;
        }
      }
      
      // Commit batch
      await batch.commit();
    }
    
    return NextResponse.json({ 
      success: true, 
      imported: importedCount,
      updated: updatedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 });
  }
}

// Parse CSV line handling quotes and commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Handle escaped quotes (two double quotes in a row)
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}