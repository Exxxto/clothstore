import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGetComplaints, apiGetProducts, DBProduct } from "../api";
import { Package, ShirtIcon, Baby, Sparkles, TrendingUp, Plus, TriangleAlert } from "lucide-react";
import { normalizeGenderValue } from "@/lib/productNormalization";
import { cn } from "@/lib/utils";
import { typeLabels } from "@/lib/productCatalog";

export default function AdminDashboard() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [complaints, setComplaints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGetProducts(),
      apiGetComplaints({ limit: 200 }),
    ])
      .then(([productRows, complaintRows]) => {
        setProducts(productRows);
        setComplaints(complaintRows.length);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const men = products.filter((p) => normalizeGenderValue(p.gender) === "men");
  const women = products.filter((p) => normalizeGenderValue(p.gender) === "women");
  const kids = products.filter((p) => normalizeGenderValue(p.gender) === "kids");
  const newItems = products.filter((p) => p.is_new);

  const stats = [
    { label: "Всего товаров", value: products.length, icon: Package, color: "bg-blue-500/10 text-blue-400", href: "/admin/products" },
    { label: "Мужские", value: men.length, icon: ShirtIcon, color: "bg-purple-500/10 text-purple-400", href: "/admin/products/men" },
    { label: "Женские", value: women.length, icon: Sparkles, color: "bg-pink-500/10 text-pink-400", href: "/admin/products/women" },
    { label: "Детские", value: kids.length, icon: Baby, color: "bg-green-500/10 text-green-400", href: "/admin/products/kids" },
    { label: "Новинки", value: newItems.length, icon: TrendingUp, color: "bg-amber-500/10 text-amber-400", href: "/admin/products" },
    { label: "Жалобы", value: complaints, icon: TriangleAlert, color: "bg-rose-500/10 text-rose-400", href: "/admin/complaints" },
  ];

  // Group by type
  const byType = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Дашборд</h1>
          <p className="text-gray-400 mt-1 text-sm">Обзор каталога товаров</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить товар
        </Link>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error} — убедитесь, что сервер запущен (<code>npm run server</code>)
        </div>
      )}

      {/* Stats */}
      <div className={cn("grid grid-cols-2 gap-4 mb-8", "lg:grid-cols-6")}>
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors group"
          >
            <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? "—" : stat.value}
            </p>
            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* By type breakdown */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">По категориям</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-28">{typeLabels[type as keyof typeof typeLabels] ?? type}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${(count / products.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
