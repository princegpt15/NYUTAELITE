// src/pages/Orders.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ArrowRight, ShoppingBag } from 'lucide-react';
import { authService } from '../services/auth';
import { orderService } from '../services/orders';
import type { Order } from '../types';

export const Orders: React.FC = () => {
  const user = authService.getCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      orderService
        .getOrders()
        .then((data) => setOrders(data))
        .catch((err) => console.error('Failed to load orders:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'SHIPPED':
        return 'bg-emerald-50 text-[#123B2A] border border-[#123B2A]/30';
      case 'DELIVERED':
        return 'bg-[#F7F1E5] text-[#123B2A] border border-[#C6A15B]/40';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-12 lg:py-16">
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
              YOUR PANTRY ACCOUNT
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#092218] mt-1">
              Order History &amp; Tracking
            </h1>
            <p className="text-xs sm:text-sm text-[#68756E] mt-0.5">
              {user ? `Account: ${user.fullName} (${user.email})` : 'Viewing household orders'}
            </p>
          </div>

          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs w-fit"
          >
            <span>Browse Makhana</span>
            <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-[#68756E] border border-[#E8DECB]">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DECB] space-y-3">
            <ShoppingBag className="w-10 h-10 text-[#68756E]/40 mx-auto" />
            <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">No Orders Yet</h2>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              You have not placed any orders yet. Discover our fresh Bihar makhana pantry packs.
            </p>
            <Link
              to="/#pantry"
              className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[#092218] transition-colors mt-2"
            >
              Shop Makhana Packs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const itemsSummary =
                order.items && order.items.length > 0
                  ? order.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')
                  : 'Makhana Pack';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-6 border border-[#E8DECB] shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8DECB] gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#E8DECB]">
                        <Package className="w-5 h-5 text-[#C6A15B]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#1C1C1C] font-mono">
                          {order.orderNumber}
                        </h3>
                        <p className="text-xs text-[#68756E]">Placed on {formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusBadgeColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-lg font-extrabold text-[#123B2A]">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-[#68756E] text-xs block">Order Items</span>
                      <span className="font-bold text-[#1C1C1C]">{itemsSummary}</span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-xs block">Payment Status</span>
                      <span className="font-bold text-[#123B2A] uppercase text-xs">
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-xs block">Shipping Tracking</span>
                      <span className="font-bold text-[#123B2A] flex items-center gap-1.5 mt-0.5">
                        <Truck className="w-4 h-4 text-[#C6A15B]" />
                        {order.shippingStatus === 'DELIVERED'
                          ? 'Delivered to Doorstep'
                          : order.shippingStatus === 'SHIPPED'
                          ? 'In Transit (BlueDart Express)'
                          : 'Processing at Bihar Pantry'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
