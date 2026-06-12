import { useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, showAuthModal } = useCustomerAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showAuthModal(location.pathname);
    }
  }, [isLoading, isAuthenticated, showAuthModal, location.pathname]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
