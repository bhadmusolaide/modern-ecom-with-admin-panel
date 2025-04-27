import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  increment, 
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { 
  Product, 
  ProductVariant, 
  InventoryStatus, 
  InventoryHistoryEntry, 
  InventoryChangeReason,
  OrderItem
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get a product's current inventory status based on stock level and threshold
 * @param stock Current stock level
 * @param lowStockThreshold Low stock threshold
 * @param backorderEnabled Whether backorders are enabled
 * @returns The inventory status
 */
export function getInventoryStatus(
  stock: number, 
  lowStockThreshold: number = 5, 
  backorderEnabled: boolean = false
): InventoryStatus {
  if (stock <= 0) {
    return backorderEnabled ? InventoryStatus.BACKORDER : InventoryStatus.OUT_OF_STOCK;
  } else if (stock <= lowStockThreshold) {
    return InventoryStatus.LOW_STOCK;
  } else {
    return InventoryStatus.IN_STOCK;
  }
}

/**
 * Update a product's inventory status based on current stock
 * @param productId Product ID
 * @returns Updated product
 */
export async function updateProductInventoryStatus(productId: string): Promise<Product | null> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error(`Product with ID ${productId} not found`);
      return null;
    }
    
    const productData = productSnap.data() as Product;
    
    // Skip if inventory tracking is disabled
    if (productData.trackInventory === false) {
      return productData;
    }
    
    const stock = productData.stock || 0;
    const lowStockThreshold = productData.lowStockThreshold || 5;
    const backorderEnabled = productData.backorderEnabled || false;
    
    const inventoryStatus = getInventoryStatus(stock, lowStockThreshold, backorderEnabled);
    
    // Update the product with the new inventory status
    await updateDoc(productRef, {
      inventoryStatus,
      updatedAt: serverTimestamp()
    });
    
    return {
      ...productData,
      inventoryStatus
    };
  } catch (error) {
    console.error('Error updating product inventory status:', error);
    throw error;
  }
}

/**
 * Update a product variant's inventory status based on current stock
 * @param productId Product ID
 * @param variantId Variant ID
 * @returns Updated product with updated variant
 */
export async function updateVariantInventoryStatus(
  productId: string, 
  variantId: string
): Promise<Product | null> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error(`Product with ID ${productId} not found`);
      return null;
    }
    
    const productData = productSnap.data() as Product;
    
    if (!productData.variants || productData.variants.length === 0) {
      console.error(`Product with ID ${productId} has no variants`);
      return productData;
    }
    
    const variantIndex = productData.variants.findIndex(v => v.id === variantId);
    
    if (variantIndex === -1) {
      console.error(`Variant with ID ${variantId} not found in product ${productId}`);
      return productData;
    }
    
    const variant = productData.variants[variantIndex];
    
    // Skip if inventory tracking is disabled
    if (variant.trackInventory === false) {
      return productData;
    }
    
    const stock = variant.stock || 0;
    const lowStockThreshold = variant.lowStockThreshold || productData.lowStockThreshold || 5;
    const backorderEnabled = variant.backorderEnabled || productData.backorderEnabled || false;
    
    const inventoryStatus = getInventoryStatus(stock, lowStockThreshold, backorderEnabled);
    
    // Create updated variants array
    const updatedVariants = [...productData.variants];
    updatedVariants[variantIndex] = {
      ...variant,
      inventoryStatus
    };
    
    // Update the product with the updated variants
    await updateDoc(productRef, {
      variants: updatedVariants,
      updatedAt: serverTimestamp()
    });
    
    return {
      ...productData,
      variants: updatedVariants
    };
  } catch (error) {
    console.error('Error updating variant inventory status:', error);
    throw error;
  }
}

/**
 * Add an inventory history entry for a product
 * @param productId Product ID
 * @param entry Inventory history entry data
 * @returns The created inventory history entry
 */
export async function addInventoryHistoryEntry(
  productId: string,
  entry: Omit<InventoryHistoryEntry, 'id' | 'date'>
): Promise<InventoryHistoryEntry> {
  try {
    const historyRef = collection(db, 'products', productId, 'inventoryHistory');
    
    const newEntry: InventoryHistoryEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      ...entry
    };
    
    await addDoc(historyRef, newEntry);
    
    return newEntry;
  } catch (error) {
    console.error('Error adding inventory history entry:', error);
    throw error;
  }
}

/**
 * Get inventory history for a product
 * @param productId Product ID
 * @param limit Maximum number of entries to return
 * @returns Array of inventory history entries
 */
export async function getInventoryHistory(
  productId: string,
  limitCount: number = 50
): Promise<InventoryHistoryEntry[]> {
  try {
    const historyRef = collection(db, 'products', productId, 'inventoryHistory');
    const q = query(historyRef, orderBy('date', 'desc'), limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const history: InventoryHistoryEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      history.push(doc.data() as InventoryHistoryEntry);
    });
    
    return history;
  } catch (error) {
    console.error('Error getting inventory history:', error);
    throw error;
  }
}

/**
 * Update product stock level
 * @param productId Product ID
 * @param change Stock change amount (positive for additions, negative for reductions)
 * @param reason Reason for the change
 * @param options Additional options
 * @returns Updated product
 */
export async function updateProductStock(
  productId: string,
  change: number,
  reason: InventoryChangeReason,
  options: {
    orderId?: string;
    userId?: string;
    notes?: string;
  } = {}
): Promise<Product | null> {
  try {
    // Use a transaction to ensure data consistency
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', productId);
      const productSnap = await transaction.get(productRef);
      
      if (!productSnap.exists()) {
        console.error(`Product with ID ${productId} not found`);
        return null;
      }
      
      const productData = productSnap.data() as Product;
      
      // Skip if inventory tracking is disabled
      if (productData.trackInventory === false) {
        return productData;
      }
      
      const currentStock = productData.stock || 0;
      const newStock = Math.max(0, currentStock + change); // Prevent negative stock
      
      // Update the product with the new stock level
      transaction.update(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });
      
      // Add inventory history entry
      const historyRef = collection(db, 'products', productId, 'inventoryHistory');
      const historyEntry: InventoryHistoryEntry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        previousStock: currentStock,
        newStock,
        change,
        reason,
        ...options
      };
      
      transaction.set(doc(historyRef, historyEntry.id), historyEntry);
      
      // Return the updated product
      return {
        ...productData,
        stock: newStock
      };
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

/**
 * Update variant stock level
 * @param productId Product ID
 * @param variantId Variant ID
 * @param change Stock change amount (positive for additions, negative for reductions)
 * @param reason Reason for the change
 * @param options Additional options
 * @returns Updated product with updated variant
 */
export async function updateVariantStock(
  productId: string,
  variantId: string,
  change: number,
  reason: InventoryChangeReason,
  options: {
    orderId?: string;
    userId?: string;
    notes?: string;
  } = {}
): Promise<Product | null> {
  try {
    // Use a transaction to ensure data consistency
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', productId);
      const productSnap = await transaction.get(productRef);
      
      if (!productSnap.exists()) {
        console.error(`Product with ID ${productId} not found`);
        return null;
      }
      
      const productData = productSnap.data() as Product;
      
      if (!productData.variants || productData.variants.length === 0) {
        console.error(`Product with ID ${productId} has no variants`);
        return productData;
      }
      
      const variantIndex = productData.variants.findIndex(v => v.id === variantId);
      
      if (variantIndex === -1) {
        console.error(`Variant with ID ${variantId} not found in product ${productId}`);
        return productData;
      }
      
      const variant = productData.variants[variantIndex];
      
      // Skip if inventory tracking is disabled
      if (variant.trackInventory === false) {
        return productData;
      }
      
      const currentStock = variant.stock || 0;
      const newStock = Math.max(0, currentStock + change); // Prevent negative stock
      
      // Create updated variants array
      const updatedVariants = [...productData.variants];
      updatedVariants[variantIndex] = {
        ...variant,
        stock: newStock
      };
      
      // Update the product with the updated variants
      transaction.update(productRef, {
        variants: updatedVariants,
        updatedAt: serverTimestamp()
      });
      
      // Add inventory history entry
      const historyRef = collection(db, 'products', productId, 'inventoryHistory');
      const historyEntry: InventoryHistoryEntry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        previousStock: currentStock,
        newStock,
        change,
        reason,
        ...options
      };
      
      transaction.set(doc(historyRef, historyEntry.id), historyEntry);
      
      // Return the updated product
      return {
        ...productData,
        variants: updatedVariants
      };
    });
  } catch (error) {
    console.error('Error updating variant stock:', error);
    throw error;
  }
}

/**
 * Check if a product is in stock
 * @param productId Product ID
 * @param quantity Quantity needed
 * @returns Whether the product is in stock
 */
export async function isProductInStock(
  productId: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return false;
    }
    
    const productData = productSnap.data() as Product;
    
    // If inventory tracking is disabled, consider it in stock
    if (productData.trackInventory === false) {
      return true;
    }
    
    const stock = productData.stock || 0;
    
    // Check if there's enough stock
    if (stock >= quantity) {
      return true;
    }
    
    // If backorders are enabled, consider it in stock
    if (productData.backorderEnabled) {
      // If there's a backorder limit, check against it
      if (productData.backorderLimit !== undefined) {
        // Calculate how many items would need to be backordered
        const backorderNeeded = quantity - stock;
        return backorderNeeded <= productData.backorderLimit;
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if product is in stock:', error);
    throw error;
  }
}

/**
 * Check if a variant is in stock
 * @param productId Product ID
 * @param variantId Variant ID
 * @param quantity Quantity needed
 * @returns Whether the variant is in stock
 */
export async function isVariantInStock(
  productId: string,
  variantId: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return false;
    }
    
    const productData = productSnap.data() as Product;
    
    if (!productData.variants || productData.variants.length === 0) {
      return false;
    }
    
    const variant = productData.variants.find(v => v.id === variantId);
    
    if (!variant) {
      return false;
    }
    
    // If inventory tracking is disabled, consider it in stock
    if (variant.trackInventory === false) {
      return true;
    }
    
    const stock = variant.stock || 0;
    
    // Check if there's enough stock
    if (stock >= quantity) {
      return true;
    }
    
    // If backorders are enabled, consider it in stock
    const backorderEnabled = variant.backorderEnabled || productData.backorderEnabled || false;
    if (backorderEnabled) {
      // If there's a backorder limit, check against it
      const backorderLimit = variant.backorderLimit || productData.backorderLimit;
      if (backorderLimit !== undefined) {
        // Calculate how many items would need to be backordered
        const backorderNeeded = quantity - stock;
        return backorderNeeded <= backorderLimit;
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if variant is in stock:', error);
    throw error;
  }
}

/**
 * Get products with low stock
 * @param limit Maximum number of products to return
 * @returns Array of products with low stock
 */
export async function getLowStockProducts(limitCount: number = 50): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('trackInventory', '==', true),
      where('inventoryStatus', '==', InventoryStatus.LOW_STOCK),
      orderBy('stock', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
}

/**
 * Get out of stock products
 * @param limit Maximum number of products to return
 * @returns Array of out of stock products
 */
export async function getOutOfStockProducts(limitCount: number = 50): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('trackInventory', '==', true),
      where('inventoryStatus', '==', InventoryStatus.OUT_OF_STOCK),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting out of stock products:', error);
    throw error;
  }
}

/**
 * Process inventory changes for an order
 * @param orderItems Order items
 * @param userId User ID
 * @param orderId Order ID
 * @returns Whether all inventory updates were successful
 */
export async function processOrderInventory(
  orderItems: OrderItem[],
  userId: string,
  orderId: string
): Promise<boolean> {
  try {
    let allUpdatesSuccessful = true;
    
    for (const item of orderItems) {
      try {
        if (item.variantId) {
          // Update variant stock
          await updateVariantStock(
            item.productId,
            item.variantId,
            -item.quantity, // Negative for reduction
            InventoryChangeReason.SALE,
            {
              orderId,
              userId,
              notes: `Order ${orderId}: ${item.quantity} units sold`
            }
          );
          
          // Update variant inventory status
          await updateVariantInventoryStatus(item.productId, item.variantId);
        } else {
          // Update product stock
          await updateProductStock(
            item.productId,
            -item.quantity, // Negative for reduction
            InventoryChangeReason.SALE,
            {
              orderId,
              userId,
              notes: `Order ${orderId}: ${item.quantity} units sold`
            }
          );
          
          // Update product inventory status
          await updateProductInventoryStatus(item.productId);
        }
      } catch (error) {
        console.error(`Error updating inventory for item ${item.id}:`, error);
        allUpdatesSuccessful = false;
      }
    }
    
    return allUpdatesSuccessful;
  } catch (error) {
    console.error('Error processing order inventory:', error);
    return false;
  }
}

/**
 * Restore inventory for cancelled or returned order items
 * @param orderItems Order items
 * @param userId User ID
 * @param orderId Order ID
 * @param reason Reason for the inventory change
 * @returns Whether all inventory updates were successful
 */
export async function restoreOrderInventory(
  orderItems: OrderItem[],
  userId: string,
  orderId: string,
  reason: InventoryChangeReason = InventoryChangeReason.RETURN
): Promise<boolean> {
  try {
    let allUpdatesSuccessful = true;
    
    for (const item of orderItems) {
      try {
        if (item.variantId) {
          // Update variant stock
          await updateVariantStock(
            item.productId,
            item.variantId,
            item.quantity, // Positive for addition
            reason,
            {
              orderId,
              userId,
              notes: `Order ${orderId}: ${item.quantity} units returned to inventory`
            }
          );
          
          // Update variant inventory status
          await updateVariantInventoryStatus(item.productId, item.variantId);
        } else {
          // Update product stock
          await updateProductStock(
            item.productId,
            item.quantity, // Positive for addition
            reason,
            {
              orderId,
              userId,
              notes: `Order ${orderId}: ${item.quantity} units returned to inventory`
            }
          );
          
          // Update product inventory status
          await updateProductInventoryStatus(item.productId);
        }
      } catch (error) {
        console.error(`Error restoring inventory for item ${item.id}:`, error);
        allUpdatesSuccessful = false;
      }
    }
    
    return allUpdatesSuccessful;
  } catch (error) {
    console.error('Error restoring order inventory:', error);
    return false;
  }
}

/**
 * Get products that need restocking
 * @param limit Maximum number of products to return
 * @returns Array of products that need restocking
 */
export async function getProductsNeedingRestock(limitCount: number = 50): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('trackInventory', '==', true),
      where('inventoryStatus', 'in', [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK]),
      orderBy('stock', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting products needing restock:', error);
    throw error;
  }
}

/**
 * Validate inventory for order items
 * @param items Order items to validate
 * @returns Object containing validation results
 */
export async function validateOrderInventory(
  items: { productId: string; variantId?: string; quantity: number }[]
): Promise<{
  valid: boolean;
  invalidItems: { productId: string; variantId?: string; available: number; requested: number }[];
  backorderedItems: { productId: string; variantId?: string; available: number; backordered: number }[];
}> {
  try {
    const invalidItems: { productId: string; variantId?: string; available: number; requested: number }[] = [];
    const backorderedItems: { productId: string; variantId?: string; available: number; backordered: number }[] = [];
    
    for (const item of items) {
      const { productId, variantId, quantity } = item;
      
      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          invalidItems.push({ productId, variantId, available: 0, requested: quantity });
          continue;
        }
        
        const productData = productSnap.data() as Product;
        
        // Handle variant inventory
        if (variantId) {
          if (!productData.variants || productData.variants.length === 0) {
            invalidItems.push({ productId, variantId, available: 0, requested: quantity });
            continue;
          }
          
          const variant = productData.variants.find(v => v.id === variantId);
          
          if (!variant) {
            invalidItems.push({ productId, variantId, available: 0, requested: quantity });
            continue;
          }
          
          // If inventory tracking is disabled, consider it valid
          if (variant.trackInventory === false) {
            continue;
          }
          
          const stock = variant.stock || 0;
          
          // Check if there's enough stock
          if (stock >= quantity) {
            continue;
          }
          
          // Check if backorders are enabled
          const backorderEnabled = variant.backorderEnabled || productData.backorderEnabled || false;
          if (backorderEnabled) {
            // If there's a backorder limit, check against it
            const backorderLimit = variant.backorderLimit || productData.backorderLimit;
            if (backorderLimit !== undefined) {
              // Calculate how many items would need to be backordered
              const backorderNeeded = quantity - stock;
              if (backorderNeeded <= backorderLimit) {
                backorderedItems.push({ 
                  productId, 
                  variantId, 
                  available: stock, 
                  backordered: backorderNeeded 
                });
                continue;
              }
            } else {
              // No backorder limit, so all can be backordered
              backorderedItems.push({ 
                productId, 
                variantId, 
                available: stock, 
                backordered: quantity - stock 
              });
              continue;
            }
          }
          
          // If we get here, the item is invalid
          invalidItems.push({ productId, variantId, available: stock, requested: quantity });
        } 
        // Handle product inventory
        else {
          // If inventory tracking is disabled, consider it valid
          if (productData.trackInventory === false) {
            continue;
          }
          
          const stock = productData.stock || 0;
          
          // Check if there's enough stock
          if (stock >= quantity) {
            continue;
          }
          
          // Check if backorders are enabled
          if (productData.backorderEnabled) {
            // If there's a backorder limit, check against it
            if (productData.backorderLimit !== undefined) {
              // Calculate how many items would need to be backordered
              const backorderNeeded = quantity - stock;
              if (backorderNeeded <= productData.backorderLimit) {
                backorderedItems.push({ 
                  productId, 
                  available: stock, 
                  backordered: backorderNeeded 
                });
                continue;
              }
            } else {
              // No backorder limit, so all can be backordered
              backorderedItems.push({ 
                productId, 
                available: stock, 
                backordered: quantity - stock 
              });
              continue;
            }
          }
          
          // If we get here, the item is invalid
          invalidItems.push({ productId, available: stock, requested: quantity });
        }
      } catch (error) {
        console.error(`Error validating inventory for item ${productId}:`, error);
        invalidItems.push({ productId, variantId, available: 0, requested: quantity });
      }
    }
    
    return {
      valid: invalidItems.length === 0,
      invalidItems,
      backorderedItems
    };
  } catch (error) {
    console.error('Error validating order inventory:', error);
    throw error;
  }
}