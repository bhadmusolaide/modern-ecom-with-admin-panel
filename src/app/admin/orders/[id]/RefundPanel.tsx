'use client';

import { useState } from 'react';
import { RefreshCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { formatCurrency } from '@/lib/utils/format';
import { OrderStatus } from '@/lib/types';

interface RefundPanelProps {
  orderId: string;
  onRefund: () => void;
}

export default function RefundPanel({ orderId, onRefund }: RefundPanelProps) {
  const { getIdToken } = useFirebaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRefund = async () => {
    if (!reason) {
      setError('Please provide a reason for the refund.');
      return;
    }

    if (!isFullRefund && !amount) {
      setError('Please provide a refund amount.');
      return;
    }

    const refundAmount = isFullRefund ? 0 : parseFloat(amount);
    if (!isFullRefund && (isNaN(refundAmount) || refundAmount <= 0)) {
      setError('Please enter a valid refund amount.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get auth token
      const token = await getIdToken();

      // Process refund via API
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          amount: isFullRefund ? 'full' : Math.round(refundAmount * 100), // Convert to cents
          isFullRefund
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }

      // Show success message
      setSuccess(`Refund processed successfully. The order status has been updated to ${OrderStatus.REFUNDED}.`);

      // Notify parent component
      setTimeout(() => {
        onRefund();
      }, 2000);
    } catch (err) {
      console.error('Error processing refund:', err);
      setError(err instanceof Error ? err.message : 'Failed to process refund. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-neutral-200">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
        >
          <RefreshCcw size={18} className="mr-2" />
          Process Refund
        </button>
      ) : (
        <div className="bg-neutral-50 p-4 rounded-md">
          <h3 className="text-md font-medium text-neutral-900 mb-3">Process Refund</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-start">
              <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>{success}</div>
            </div>
          )}

          <div className="space-y-4 mb-4">
            <div className="flex items-center space-x-2">
              <input
                id="fullRefund"
                type="checkbox"
                checked={isFullRefund}
                onChange={(e) => setIsFullRefund(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="fullRefund" className="ml-2 block text-sm text-neutral-700">
                Full Refund
              </label>
            </div>

            {!isFullRefund && (
              <div>
                <label htmlFor="refundAmount" className="block text-sm font-medium text-neutral-700 mb-1">
                  Refund Amount ($)
                </label>
                <input
                  type="number"
                  id="refundAmount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md"
                />
              </div>
            )}

            <div>
              <label htmlFor="refundReason" className="block text-sm font-medium text-neutral-700 mb-1">
                Refund Reason
              </label>
              <select
                id="refundReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md"
              >
                <option value="">Select a reason</option>
                <option value="customer_request">Customer Request</option>
                <option value="damaged_item">Damaged Item</option>
                <option value="wrong_item">Wrong Item Shipped</option>
                <option value="late_delivery">Late Delivery</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleRefund}
              disabled={isProcessing || !reason || (!isFullRefund && !amount)}
              className={`px-4 py-2 rounded-md ${
                isProcessing || !reason || (!isFullRefund && !amount)
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              } transition-colors`}
            >
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}