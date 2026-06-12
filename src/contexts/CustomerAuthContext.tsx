import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiCustomerLogin, apiCustomerRegister, type CustomerUser } from "@/lib/storeApi";

const CUSTOMER_TOKEN_KEY = "clothstore.customer.token.v1";
const CUSTOMER_USER_KEY = "clothstore.customer.user.v1";

interface CustomerAuthState {
  isAuthenticated: boolean;
  user: CustomerUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  showAuthModal: (redirectPath?: string) => void;
  hideAuthModal: () => void;
  isAuthModalOpen: boolean;
  pendingRedirect: string | null;
}

const CustomerAuthContext = createContext<CustomerAuthState | null>(null);

function readStoredUser(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Проверка токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_USER_KEY);
        setIsLoading(false);
        return;
      }
      const storedUser = readStoredUser();
      if (!storedUser) {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        setIsLoading(false);
        return;
      }
      setUser(storedUser);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiCustomerLogin(email, password);
    localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  }, []);

  const register = useCallback(async (data: { first_name: string; last_name: string; email: string; password: string }) => {
    const result = await apiCustomerRegister(data);
    localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setIsAuthModalOpen(false);
    setPendingRedirect(null);
  }, []);

  const showAuthModal = useCallback((redirectPath?: string) => {
    setPendingRedirect(redirectPath || null);
    setIsAuthModalOpen(true);
  }, []);

  const hideAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingRedirect(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        register,
        logout,
        showAuthModal,
        hideAuthModal,
        isAuthModalOpen,
        pendingRedirect,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthState {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return ctx;
}
