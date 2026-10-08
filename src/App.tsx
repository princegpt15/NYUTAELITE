// src/App.tsx
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileStickyCart } from './components/MobileStickyCart';
import { Home } from './pages/Home';
import { Product } from './pages/Product';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Cart } from './pages/Cart';

import { AdminLayout } from './layouts/AdminLayout';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';

import { authService } from './services/auth';
import { AnalyticsAndSeoObserver } from './components/AnalyticsAndSeoObserver';
import { AnalyticsConsentBanner } from './components/AnalyticsConsentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Secondary Storefront Routes (Lazy-loaded)
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const FAQ = lazy(() => import('./pages/FAQ').then((m) => ({ default: m.FAQ })));
const Checkout = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.Checkout })));
const Orders = lazy(() => import('./pages/Orders').then((m) => ({ default: m.Orders })));
const Account = lazy(() => import('./pages/Account').then((m) => ({ default: m.Account })));
const Wishlist = lazy(() => import('./pages/Wishlist').then((m) => ({ default: m.Wishlist })));

// Admin Portal Components (Lazy-loaded to keep customer bundle lean)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail').then((m) => ({ default: m.AdminOrderDetail })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews })));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail').then((m) => ({ default: m.AdminCustomerDetail })));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments').then((m) => ({ default: m.AdminPayments })));
const AdminPaymentDetail = lazy(() => import('./pages/admin/AdminPaymentDetail').then((m) => ({ default: m.AdminPaymentDetail })));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications').then((m) => ({ default: m.AdminNotifications })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then((m) => ({ default: m.AdminAnalytics })));
const AdminSystemHealth = lazy(() => import('./pages/admin/AdminSystemHealth').then((m) => ({ default: m.AdminSystemHealth })));
const AdminCampaigns = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminGrowthAnalytics = lazy(() => import('./pages/admin/AdminGrowthAnalytics'));
const AdminExperiments = lazy(() => import('./pages/admin/AdminExperiments'));

function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[350px] py-16" aria-busy="true" aria-label="Loading page">
      <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

/**
 * Customer Storefront Shell with Header, Footer, Sticky Cart, and Privacy Consent Banner
 */
function StorefrontLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <MobileStickyCart />
      <AnalyticsConsentBanner />
      <Footer />
    </div>
  );
}

export function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await authService.restoreSession();
      } catch {
        // ignore – handled inside service
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  if (initializing) {
    // placeholder during initial session restore
    return null;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsAndSeoObserver />
        <Routes>
          {/* Dedicated Admin Portal Routes */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AdminLogin />
              </Suspense>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="analytics/products" element={<AdminAnalytics />} />
            <Route path="growth-analytics" element={<AdminGrowthAnalytics />} />
            <Route path="experiments" element={<AdminExperiments />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="system-health" element={<AdminSystemHealth />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="payments/:id" element={<AdminPaymentDetail />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          {/* Customer Storefront Routes */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products/makhana" element={<Product />} />
            <Route path="/products/:sku" element={<Product />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/account" element={<Account />} />
            <Route path="/wishlist" element={<Wishlist />} />
            {/* Fallback route */}
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
