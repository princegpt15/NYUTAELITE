import React from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText, Truck, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth';

export const Orders: React.FC = () => {
  const user = authService.getCurrentUser();

  const mockOrders = [
    {
      id: 'SUV-2026-8941',
      date: '24 Sep 2026',
      items: 'NYUTAELITE Premium Makhana — Grade A',
      quantity: '50 KG',
      total: '₹22,050',
      status: 'Dispatched',
      statusColor: 'bg-blue-100 text-blue-800',
      tracking: 'VRL Express Logistics (LR #88921049)',
      invoice: 'INV-SUV-8941.pdf',
    },
    {
      id: 'SUV-2026-7812',
      date: '12 Aug 2026',
      items: 'NYUTAELITE Premium Makhana — Grade A',
      quantity: '100 KG',
      total: '₹40,950',
      status: 'Delivered',
      statusColor: 'bg-emerald-100 text-emerald-800',
      tracking: 'Safexpress Cargo (Delivered to Mumbai Hub)',
      invoice: 'INV-SUV-7812.pdf',
    },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
              COMMERCIAL ACCOUNT
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C2520] tracking-tight mt-1">
              Wholesale Order History
            </h1>
            <p className="text-xs sm:text-sm text-[#5E6C65] mt-0.5">
              {user ? `Account: ${user.fullName} (${user.email})` : 'Viewing verified enterprise consignments'}
            </p>
          </div>

          <Link
            to="/products/premium-makhana"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C950] hover:bg-[#00b347] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all w-fit"
          >
            <span>Place New Bulk Order</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {mockOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD3] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EBE1] gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#173F35]/10 text-[#173F35] flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1C2520]">{order.id}</h3>
                    <p className="text-xs text-[#5E6C65]">Ordered on {order.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${order.statusColor}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-lg font-black text-[#173F35]">{order.total}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-[#5E6C65] block">Consignment Description</span>
                  <span className="font-semibold text-[#1C2520]">{order.items}</span>
                </div>
                <div>
                  <span className="text-[#5E6C65] block">Net Weight</span>
                  <span className="font-semibold text-[#1C2520]">{order.quantity} (Vacuum Packed)</span>
                </div>
                <div>
                  <span className="text-[#5E6C65] block">Freight Tracking</span>
                  <span className="font-semibold text-[#1C2520] flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-4 h-4 text-[#00C950]" />
                    {order.tracking}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => alert(`Downloading GST Tax Invoice for order ${order.id}`)}
                  className="inline-flex items-center gap-1.5 font-bold text-[#173F35] hover:text-[#00C950] cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download GST Tax Invoice (PDF)</span>
                </button>
                <span className="text-[#5E6C65]">HSN 19041090 · 5% GST Included</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
