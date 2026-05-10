import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  ShirtIcon,
  Baby,
  Sparkles,
  LogOut,
  ChevronRight,
  Package,
  User,
  ShoppingBag,
  Tags,
  TriangleAlert,
  Boxes,
  Layers3,
  Building2,
  BadgePercent,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiGetComplaints } from "@/admin/api";

interface AdminSidebarProps {
  username: string;
  fullName: string;
  role: string;
  onLogout: () => void;
}

const navItems = [
  {
    label: "Дашборд",
    href: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Аналитика",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Все товары",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Заказы",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Жалобы",
    href: "/admin/complaints",
    icon: TriangleAlert,
  },
  {
    label: "Категории",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Коллекции",
    href: "/admin/collections",
    icon: Layers3,
  },
  {
    label: "Варианты SKU",
    href: "/admin/variants",
    icon: Package,
  },
  {
    label: "Остатки",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    label: "Склады",
    href: "/admin/warehouses",
    icon: Building2,
  },
  {
    label: "Промокоды",
    href: "/admin/promo-codes",
    icon: BadgePercent,
  },
  {
    label: "Доставка и оплата",
    href: "/admin/checkout-methods",
    icon: CreditCard,
  },
  {
    label: "Мужские товары",
    href: "/admin/products/men",
    icon: ShirtIcon,
  },
  {
    label: "Женские товары",
    href: "/admin/products/women",
    icon: Sparkles,
  },
  {
    label: "Детские товары",
    href: "/admin/products/kids",
    icon: Baby,
  },
];

export default function AdminSidebar({ username, fullName, role, onLogout }: AdminSidebarProps) {
  const navigate = useNavigate();
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);

  useEffect(() => {
    let active = true;

    apiGetComplaints({ status: "new", limit: 200 })
      .then((rows) => {
        if (active) setNewComplaintsCount(rows.length);
      })
      .catch(() => {
        if (active) setNewComplaintsCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-gray-900 font-bold text-xs">L</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide">Силуэт</p>
            <p className="text-gray-500 text-xs">Панель администратора</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-gray-900" : "text-gray-500 group-hover:text-white")} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/complaints" && (
                  <span
                    className={cn(
                      "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      newComplaintsCount > 0
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-gray-700 text-gray-300"
                    )}
                  >
                    {newComplaintsCount}
                  </span>
                )}
                <ChevronRight className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100")} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{fullName || username}</p>
            <p className="text-gray-500 text-xs capitalize">{role === "superadmin" ? "Супер-админ" : "Администратор"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
