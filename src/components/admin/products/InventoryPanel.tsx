'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/context/ToastContext';
import { 
  Product, 
  ProductVariant, 
  InventoryStatus, 
  InventoryHistoryEntry, 
  InventoryChangeReason 
} from '@/lib/types';
import { 
  updateProductStock, 
  updateVariantStock, 
  getInventoryHistory, 
  updateProductInventoryStatus, 
  updateVariantInventoryStatus 
} from '@/lib/firebase/inventory';
import { 
  FiAlertCircle, 
  FiArrowDown, 
  FiArrowUp, 
  FiCalendar, 
  FiEdit, 
  FiPackage, 
  FiRefreshCw, 
  FiTruck, 
  FiUser 
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form schema for stock adjustment
const stockAdjustmentSchema = z.object({
  change: z.number()
    .int('Quantity must be a whole number')
    .refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum([
    InventoryChangeReason.ADJUSTMENT, 
    InventoryChangeReason.RESTOCK, 
    InventoryChangeReason.DAMAGED, 
    InventoryChangeReason.RETURN, 
    InventoryChangeReason.SYNC
  ]),
  notes: z.string().optional(),
});

// Form schema for inventory settings
const inventorySettingsSchema = z.object({
  trackInventory: z.boolean(),
  lowStockThreshold: z.number().int().min(1).optional(),
  backorderEnabled: z.boolean(),
  backorderLimit: z.number().int().min(1).optional(),
  warehouseLocation: z.string().optional(),
  restockDate: z.string().optional(),
});

type InventoryPanelProps = {
  product: Product;
  onProductUpdate: (updatedProduct: Product) => void;
};

export default function InventoryPanel({ product, onProductUpdate }: InventoryPanelProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('main');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [historyEntries, setHistoryEntries] = useState<InventoryHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  
  // Stock adjustment form
  const stockAdjustmentForm = useForm<z.infer<typeof stockAdjustmentSchema>>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      change: 1,
      reason: InventoryChangeReason.ADJUSTMENT,
      notes: '',
    },
  });
  
  // Inventory settings form
  const inventorySettingsForm = useForm<z.infer<typeof inventorySettingsSchema>>({
    resolver: zodResolver(inventorySettingsSchema),
    defaultValues: {
      trackInventory: product.trackInventory || false,
      lowStockThreshold: product.lowStockThreshold || 5,
      backorderEnabled: product.backorderEnabled || false,
      backorderLimit: product.backorderLimit,
      warehouseLocation: product.warehouseLocation || '',
      restockDate: product.restockDate || '',
    },
  });
  
  // Load inventory history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadInventoryHistory();
    }
  }, [activeTab]);
  
  // Load inventory history
  const loadInventoryHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getInventoryHistory(product.id);
      setHistoryEntries(history);
    } catch (error) {
      console.error('Error loading inventory history:', error);
      showToast('Failed to load inventory history', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Handle stock adjustment submission
  const handleStockAdjustment = async (data: z.infer<typeof stockAdjustmentSchema>) => {
    setIsAdjustingStock(true);
    try {
      if (selectedVariant) {
        // Update variant stock
        const updatedProduct = await updateVariantStock(
          product.id,
          selectedVariant.id,
          data.change,
          data.reason,
          {
            userId: 'admin', // In a real app, use the actual admin user ID
            notes: data.notes
          }
        );
        
        if (updatedProduct) {
          // Update variant inventory status
          const finalProduct = await updateVariantInventoryStatus(product.id, selectedVariant.id);
          if (finalProduct) {
            onProductUpdate(finalProduct);
            showToast(`Variant stock updated successfully`, 'success');
          }
        }
      } else {
        // Update product stock
        const updatedProduct = await updateProductStock(
          product.id,
          data.change,
          data.reason,
          {
            userId: 'admin', // In a real app, use the actual admin user ID
            notes: data.notes
          }
        );
        
        if (updatedProduct) {
          // Update product inventory status
          const finalProduct = await updateProductInventoryStatus(product.id);
          if (finalProduct) {
            onProductUpdate(finalProduct);
            showToast('Product stock updated successfully', 'success');
          }
        }
      }
      
      // Reset form and close dialog
      stockAdjustmentForm.reset({
        change: 1,
        reason: InventoryChangeReason.ADJUSTMENT,
        notes: '',
      });
      setIsAdjustingStock(false);
      
      // Reload inventory history if on history tab
      if (activeTab === 'history') {
        loadInventoryHistory();
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showToast('Failed to update stock', 'error');
      setIsAdjustingStock(false);
    }
  };
  
  // Handle inventory settings submission
  const handleInventorySettings = async (data: z.infer<typeof inventorySettingsSchema>) => {
    try {
      // Prepare updated product data
      const updatedProductData = {
        ...product,
        trackInventory: data.trackInventory,
        lowStockThreshold: data.lowStockThreshold,
        backorderEnabled: data.backorderEnabled,
        backorderLimit: data.backorderLimit,
        warehouseLocation: data.warehouseLocation,
        restockDate: data.restockDate,
      };
      
      // In a real implementation, you would update the product in the database
      // For now, we'll just update the local state
      onProductUpdate(updatedProductData);
      
      showToast('Inventory settings updated successfully', 'success');
      setIsEditingSettings(false);
    } catch (error) {
      console.error('Error updating inventory settings:', error);
      showToast('Failed to update inventory settings', 'error');
    }
  };
  
  // Get inventory status badge color
  const getStatusBadgeColor = (status?: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return 'bg-green-100 text-green-800 border-green-200';
      case InventoryStatus.LOW_STOCK:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case InventoryStatus.OUT_OF_STOCK:
        return 'bg-red-100 text-red-800 border-red-200';
      case InventoryStatus.BACKORDER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case InventoryStatus.DISCONTINUED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get inventory status label
  const getStatusLabel = (status?: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return 'In Stock';
      case InventoryStatus.LOW_STOCK:
        return 'Low Stock';
      case InventoryStatus.OUT_OF_STOCK:
        return 'Out of Stock';
      case InventoryStatus.BACKORDER:
        return 'Backorder';
      case InventoryStatus.DISCONTINUED:
        return 'Discontinued';
      default:
        return 'Unknown';
    }
  };
  
  // Get reason label
  const getReasonLabel = (reason: InventoryChangeReason) => {
    switch (reason) {
      case InventoryChangeReason.SALE:
        return 'Sale';
      case InventoryChangeReason.RETURN:
        return 'Return';
      case InventoryChangeReason.ADJUSTMENT:
        return 'Adjustment';
      case InventoryChangeReason.RESTOCK:
        return 'Restock';
      case InventoryChangeReason.DAMAGED:
        return 'Damaged';
      case InventoryChangeReason.INITIAL:
        return 'Initial Setup';
      case InventoryChangeReason.SYNC:
        return 'Sync';
      default:
        return reason;
    }
  };
  
  // Get reason icon
  const getReasonIcon = (reason: InventoryChangeReason) => {
    switch (reason) {
      case InventoryChangeReason.SALE:
        return <FiArrowDown className="text-red-500" />;
      case InventoryChangeReason.RETURN:
        return <FiArrowUp className="text-green-500" />;
      case InventoryChangeReason.ADJUSTMENT:
        return <FiEdit className="text-blue-500" />;
      case InventoryChangeReason.RESTOCK:
        return <FiTruck className="text-green-500" />;
      case InventoryChangeReason.DAMAGED:
        return <FiAlertCircle className="text-red-500" />;
      case InventoryChangeReason.INITIAL:
        return <FiPackage className="text-blue-500" />;
      case InventoryChangeReason.SYNC:
        return <FiRefreshCw className="text-purple-500" />;
      default:
        return <FiEdit className="text-gray-500" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FiPackage className="mr-2" /> Inventory Management
        </CardTitle>
        <CardDescription>
          Manage product inventory, track stock levels, and view history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="main">Main Inventory</TabsTrigger>
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <TabsTrigger value="variants">Variants</TabsTrigger>
            )}
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Main Inventory Tab */}
          <TabsContent value="main">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Product Inventory</h3>
                  <p className="text-sm text-gray-500">
                    {product.trackInventory 
                      ? 'Inventory tracking is enabled for this product' 
                      : 'Inventory tracking is disabled for this product'
                    }
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      setSelectedVariant(null);
                      stockAdjustmentForm.reset({
                        change: 1,
                        reason: InventoryChangeReason.ADJUSTMENT,
                        notes: '',
                      });
                    }}>
                      Adjust Stock
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust Stock Level</DialogTitle>
                      <DialogDescription>
                        Update the stock level for {product.name}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...stockAdjustmentForm}>
                      <form onSubmit={stockAdjustmentForm.handleSubmit(handleStockAdjustment)} className="space-y-4">
                        <FormField
                          control={stockAdjustmentForm.control}
                          name="change"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity Change</FormLabel>
                              <FormDescription>
                                Enter a positive number to add stock or a negative number to remove stock
                              </FormDescription>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stockAdjustmentForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={InventoryChangeReason.ADJUSTMENT}>
                                    Manual Adjustment
                                  </SelectItem>
                                  <SelectItem value={InventoryChangeReason.RESTOCK}>
                                    Restock
                                  </SelectItem>
                                  <SelectItem value={InventoryChangeReason.DAMAGED}>
                                    Damaged Goods
                                  </SelectItem>
                                  <SelectItem value={InventoryChangeReason.RETURN}>
                                    Customer Return
                                  </SelectItem>
                                  <SelectItem value={InventoryChangeReason.SYNC}>
                                    Inventory Sync
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={stockAdjustmentForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add any additional notes about this adjustment"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={isAdjustingStock}
                          >
                            {isAdjustingStock ? 'Updating...' : 'Update Stock'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-gray-500">Current Stock</div>
                    <div className="text-3xl font-bold mt-1">{product.stock || 0}</div>
                    {product.trackInventory && (
                      <Badge 
                        className={`mt-2 ${getStatusBadgeColor(product.inventoryStatus)}`}
                      >
                        {getStatusLabel(product.inventoryStatus)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-gray-500">Low Stock Threshold</div>
                    <div className="text-3xl font-bold mt-1">{product.lowStockThreshold || 'N/A'}</div>
                    {product.trackInventory && product.lowStockThreshold && (
                      <div className="text-sm text-gray-500 mt-2">
                        {product.stock && product.stock <= product.lowStockThreshold 
                          ? 'Currently below threshold' 
                          : 'Currently above threshold'
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-gray-500">Backorder Status</div>
                    <div className="text-3xl font-bold mt-1">
                      {product.backorderEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                    {product.backorderEnabled && (
                      <div className="text-sm text-gray-500 mt-2">
                        Limit: {product.backorderLimit || 'Unlimited'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {product.trackInventory && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <FiTruck className="mr-2 text-gray-400" />
                      <span className="text-sm font-medium">Warehouse Location:</span>
                      <span className="text-sm ml-2">{product.warehouseLocation || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-gray-400" />
                      <span className="text-sm font-medium">Expected Restock Date:</span>
                      <span className="text-sm ml-2">{product.restockDate || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Variants Tab */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <TabsContent value="variants">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Variant Inventory</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={!selectedVariant}>
                        Adjust Variant Stock
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Variant Stock Level</DialogTitle>
                        <DialogDescription>
                          Update the stock level for {selectedVariant?.name || 'selected variant'}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...stockAdjustmentForm}>
                        <form onSubmit={stockAdjustmentForm.handleSubmit(handleStockAdjustment)} className="space-y-4">
                          <FormField
                            control={stockAdjustmentForm.control}
                            name="change"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity Change</FormLabel>
                                <FormDescription>
                                  Enter a positive number to add stock or a negative number to remove stock
                                </FormDescription>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={stockAdjustmentForm.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a reason" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={InventoryChangeReason.ADJUSTMENT}>
                                      Manual Adjustment
                                    </SelectItem>
                                    <SelectItem value={InventoryChangeReason.RESTOCK}>
                                      Restock
                                    </SelectItem>
                                    <SelectItem value={InventoryChangeReason.DAMAGED}>
                                      Damaged Goods
                                    </SelectItem>
                                    <SelectItem value={InventoryChangeReason.RETURN}>
                                      Customer Return
                                    </SelectItem>
                                    <SelectItem value={InventoryChangeReason.SYNC}>
                                      Inventory Sync
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={stockAdjustmentForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Add any additional notes about this adjustment"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={isAdjustingStock || !selectedVariant}
                            >
                              {isAdjustingStock ? 'Updating...' : 'Update Stock'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Backorder</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant) => (
                      <TableRow 
                        key={variant.id}
                        className={selectedVariant?.id === variant.id ? 'bg-gray-50' : ''}
                      >
                        <TableCell>
                          <div className="font-medium">{variant.name}</div>
                          <div className="text-sm text-gray-500">
                            {variant.color && `Color: ${variant.color}`}
                            {variant.color && variant.size && ', '}
                            {variant.size && `Size: ${variant.size}`}
                          </div>
                        </TableCell>
                        <TableCell>{variant.sku || 'N/A'}</TableCell>
                        <TableCell>{variant.stock || 0}</TableCell>
                        <TableCell>
                          <Badge 
                            className={getStatusBadgeColor(variant.inventoryStatus)}
                          >
                            {getStatusLabel(variant.inventoryStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {variant.trackInventory ? 'Enabled' : 'Disabled'}
                        </TableCell>
                        <TableCell>
                          {variant.backorderEnabled ? 'Enabled' : 'Disabled'}
                          {variant.backorderEnabled && variant.backorderLimit && (
                            <span className="text-xs text-gray-500 block">
                              Limit: {variant.backorderLimit}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedVariant(variant);
                              stockAdjustmentForm.reset({
                                change: 1,
                                reason: InventoryChangeReason.ADJUSTMENT,
                                notes: '',
                              });
                            }}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
          
          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Inventory History</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadInventoryHistory}
                  disabled={isLoadingHistory}
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh
                </Button>
              </div>
              
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading history...</p>
                </div>
              ) : historyEntries.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-gray-500">No inventory history available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {entry.change > 0 ? (
                              <span className="text-green-600 flex items-center">
                                <FiArrowUp className="mr-1" />+{entry.change}
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center">
                                <FiArrowDown className="mr-1" />{entry.change}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getReasonIcon(entry.reason)}
                            <span className="ml-1">{getReasonLabel(entry.reason)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{entry.previousStock}</TableCell>
                        <TableCell>{entry.newStock}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FiUser className="mr-1 text-gray-400" />
                            <span>{entry.userId || 'System'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {entry.notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Inventory Settings</h3>
                <Button 
                  variant="outline"
                  onClick={() => {
                    inventorySettingsForm.reset({
                      trackInventory: product.trackInventory || false,
                      lowStockThreshold: product.lowStockThreshold || 5,
                      backorderEnabled: product.backorderEnabled || false,
                      backorderLimit: product.backorderLimit,
                      warehouseLocation: product.warehouseLocation || '',
                      restockDate: product.restockDate || '',
                    });
                    setIsEditingSettings(true);
                  }}
                >
                  <FiEdit className="mr-2" />
                  Edit Settings
                </Button>
              </div>
              
              {isEditingSettings ? (
                <Form {...inventorySettingsForm}>
                  <form onSubmit={inventorySettingsForm.handleSubmit(handleInventorySettings)} className="space-y-4">
                    <FormField
                      control={inventorySettingsForm.control}
                      name="trackInventory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Track Inventory
                            </FormLabel>
                            <FormDescription>
                              Enable inventory tracking for this product
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {inventorySettingsForm.watch('trackInventory') && (
                      <>
                        <FormField
                          control={inventorySettingsForm.control}
                          name="lowStockThreshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Low Stock Threshold</FormLabel>
                              <FormDescription>
                                Set the quantity at which the product is considered low in stock
                              </FormDescription>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={inventorySettingsForm.control}
                          name="backorderEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Allow Backorders
                                </FormLabel>
                                <FormDescription>
                                  Allow customers to order this product when it's out of stock
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {inventorySettingsForm.watch('backorderEnabled') && (
                          <FormField
                            control={inventorySettingsForm.control}
                            name="backorderLimit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Backorder Limit</FormLabel>
                                <FormDescription>
                                  Maximum number of units that can be backordered (leave empty for unlimited)
                                </FormDescription>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value || ''}
                                    onChange={e => {
                                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={inventorySettingsForm.control}
                          name="warehouseLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Warehouse Location</FormLabel>
                              <FormDescription>
                                Specify where this product is stored (optional)
                              </FormDescription>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={inventorySettingsForm.control}
                          name="restockDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Restock Date</FormLabel>
                              <FormDescription>
                                When do you expect this product to be restocked? (optional)
                              </FormDescription>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsEditingSettings(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Save Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium text-gray-500">Inventory Tracking</h4>
                        <div className="text-lg font-medium mt-1">
                          {product.trackInventory ? 'Enabled' : 'Disabled'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium text-gray-500">Low Stock Threshold</h4>
                        <div className="text-lg font-medium mt-1">
                          {product.trackInventory 
                            ? (product.lowStockThreshold || 'Not set') 
                            : 'N/A'
                          }
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium text-gray-500">Backorders</h4>
                        <div className="text-lg font-medium mt-1">
                          {product.trackInventory 
                            ? (product.backorderEnabled ? 'Enabled' : 'Disabled') 
                            : 'N/A'
                          }
                        </div>
                        {product.trackInventory && product.backorderEnabled && (
                          <div className="text-sm text-gray-500 mt-1">
                            Limit: {product.backorderLimit !== undefined ? product.backorderLimit : 'Unlimited'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium text-gray-500">Warehouse Location</h4>
                        <div className="text-lg font-medium mt-1">
                          {product.warehouseLocation || 'Not specified'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {product.trackInventory && product.restockDate && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-medium text-gray-500">Expected Restock Date</h4>
                        <div className="text-lg font-medium mt-1">
                          {new Date(product.restockDate).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}