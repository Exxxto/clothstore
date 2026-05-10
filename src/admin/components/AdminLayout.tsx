import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  isAuthenticated: boolean;
  username: string;
  fullName: string;
  role: string;
  onLogout: () => void;
}

export default function AdminLayout({ isAuthenticated, username, fullName, role, onLogout }: AdminLayoutProps) {
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <AdminSidebar username={username} fullName={fullName} role={role} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
