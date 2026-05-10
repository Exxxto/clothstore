import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("admin_token");
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("admin_username") || "";
  });
  const [fullName, setFullName] = useState<string>(() => {
    return localStorage.getItem("admin_full_name") || "";
  });
  const [role, setRole] = useState<string>(() => {
    return localStorage.getItem("admin_role") || "";
  });

  const login = (token: string, user: string, full_name?: string, userRole?: string) => {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_username", user);
    localStorage.setItem("admin_full_name", full_name || user);
    localStorage.setItem("admin_role", userRole || "admin");
    setIsAuthenticated(true);
    setUsername(user);
    setFullName(full_name || user);
    setRole(userRole || "admin");
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    localStorage.removeItem("admin_full_name");
    localStorage.removeItem("admin_role");
    setIsAuthenticated(false);
    setUsername("");
    setFullName("");
    setRole("");
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        logout();
      }
    } catch {
      logout();
    }
  }, []);

  return { isAuthenticated, username, fullName, role, login, logout };
}
