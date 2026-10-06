// src/components/admin/StatusBadge.tsx
import React from 'react';
import type { OrderStatus, PaymentStatus, ShippingStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | ShippingStatus | string;
  type?: 'order' | 'payment' | 'shipping';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order', className = '' }) => {
  const getStyles = () => {
    switch (status) {
      // Success / Complete / Delivered / Captured
      case 'DELIVERED':
      case 'CAPTURED':
        return 'bg-[#F7F1E5] text-[#123B2A] border-[#C6A15B]/60';

      // Active / In-transit / Processing / Shipped
      case 'SHIPPED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'AUTHORIZED':
        return 'bg-blue-50 text-blue-800 border-blue-200';

      // Cancelled / Failed / Returned
      case 'CANCELLED':
      case 'FAILED':
      case 'RETURNED':
      case 'REFUNDED':
        return 'bg-red-50 text-red-700 border-red-200';

      // Pending / Awaiting
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border tracking-wider select-none ${getStyles()} ${className}`}
    >
      {type === 'payment' && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />}
      {status}
    </span>
  );
};
