// src/layouts/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { authService } from '../services/auth';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentUser = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-[#FCFAF5] flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          currentUser={currentUser}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[300px] py-16" aria-busy="true">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};
