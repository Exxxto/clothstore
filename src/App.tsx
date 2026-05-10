import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "@/pages/Index";
import Category from "@/pages/Category";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import FittingRoom from "@/pages/FittingRoom";
import Account from "@/pages/Account";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import AdminLogin from "@/admin/pages/AdminLogin";
import AdminLayout from "@/admin/components/AdminLayout";
import AdminDashboard from "@/admin/pages/AdminDashboard";
import AdminAnalytics from "@/admin/pages/AdminAnalytics";
import AdminProducts from "@/admin/pages/AdminProducts";
import AdminProductCreate from "@/admin/pages/AdminProductCreate";
import AdminProductEdit from "@/admin/pages/AdminProductEdit";
import AdminCategories from "@/admin/pages/AdminCategories";
import AdminCollections from "@/admin/pages/AdminCollections";
import AdminOrders from "@/admin/pages/AdminOrders";
import AdminComplaints from "@/admin/pages/AdminComplaints";
import AdminWarehouses from "@/admin/pages/AdminWarehouses";
import AdminProductVariants from "@/admin/pages/AdminProductVariants";
import AdminInventory from "@/admin/pages/AdminInventory";
import AdminPromoCodes from "@/admin/pages/AdminPromoCodes";
import AdminCheckoutMethods from "@/admin/pages/AdminCheckoutMethods";
import { useAuth } from "@/admin/useAuth";
import Complaints from "@/pages/Complaints";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated, username, fullName, role, login, logout } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public store routes */}
            <Route path="/" element={<Index />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/fitting-room" element={<FittingRoom />} />
            <Route path="/account" element={<Account />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/complaints" element={<Complaints />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin onLogin={login} />} />
            <Route
              path="/admin"
              element={
                <AdminLayout
                  isAuthenticated={isAuthenticated}
                  username={username}
                  fullName={fullName}
                  role={role}
                  onLogout={logout}
                />
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              {/* All products */}
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductCreate />} />
              <Route path="products/:id/edit" element={<AdminProductEdit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="warehouses" element={<AdminWarehouses />} />
              <Route path="variants" element={<AdminProductVariants />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="promo-codes" element={<AdminPromoCodes />} />
              <Route path="checkout-methods" element={<AdminCheckoutMethods />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="complaints" element={<AdminComplaints />} />
              {/* By gender */}
              <Route path="products/:gender" element={<AdminProducts />} />
              <Route path="products/:gender/new" element={<AdminProductCreate />} />
              <Route path="products/:gender/:id/edit" element={<AdminProductEdit />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
