import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGetProducts, apiDeleteProduct, DBProduct } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Tag, Sparkles, X } from "lucide-react";
import { genderLabels, seasonLabels, typeLabels } from "@/data/products";
import { getGenderLabel, normalizeGenderValue } from "@/lib/productNormalization";

const GENDER_LABELS: Record<string, string> = {
  men: "Мужские товары",
  women: "Женские товары",
  kids: "Детские товары",
};

const TYPES = ["all", "tshirts", "jeans", "jackets", "sneakers", "sweaters", "dresses", "pants", "shirts", "hoodies", "skirts"];
const SEASONS = ["all", "spring", "summer", "autumn", "winter"];
const GENDERS = ["all", "men", "women", "kids"];
const STATUSES = ["all", "new", "sale", "regular"];
const PRICE_RANGES = [
  { value: "all", label: "Любая цена" },
  { value: "0-2000", label: "До 2 000 ₽" },
  { value: "2000-5000", label: "2 000 – 5 000 ₽" },
  { value: "5000-10000", label: "5 000 – 10 000 ₽" },
  { value: "10000-999999", label: "От 10 000 ₽" },
];

const STATUS_LABELS: Record<string, string> = {
  all: "Любой статус",
  new: "Новинка",
  sale: "Скидка",
  regular: "Обычный",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export default function AdminProducts() {
  const { gender: genderSlug } = useParams<{ gender?: string }>();
  const routeGenderFilter = normalizeGenderValue(genderSlug);
  const pageTitle = routeGenderFilter ? GENDER_LABELS[routeGenderFilter] : genderSlug ? `${getGenderLabel(genderSlug)} товары` : "Все товары";
  const backPath = genderSlug ? `/admin/products/${genderSlug}` : "/admin/products";

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Если пришли через роут /admin/products/:gender — фиксируем пол из URL
  const effectiveGender = routeGenderFilter ?? (genderFilter !== "all" ? genderFilter : undefined);

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "all" ||
    seasonFilter !== "all" ||
    genderFilter !== "all" ||
    priceFilter !== "all" ||
    statusFilter !== "all";

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setSeasonFilter("all");
    setGenderFilter("all");
    setPriceFilter("all");
    setStatusFilter("all");
  }

  const load = useCallback(() => {
    setLoading(true);
    apiGetProducts({
      gender: effectiveGender,
      type: typeFilter !== "all" ? typeFilter : undefined,
      season: seasonFilter !== "all" ? seasonFilter : undefined,
      search: search || undefined,
    })
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [effectiveGender, typeFilter, seasonFilter, search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Клиентская фильтрация по цене и статусу (сервер их не поддерживает)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Цена
      if (priceFilter !== "all") {
        const [min, max] = priceFilter.split("-").map(Number);
        if (p.price < min || p.price > max) return false;
      }
      // Статус
      if (statusFilter === "new" && !p.is_new) return false;
      if (statusFilter === "sale" && !(p.old_price !== null && p.old_price > p.price)) return false;
      if (statusFilter === "regular" && (p.is_new || (p.old_price !== null && p.old_price > p.price))) return false;
      return true;
    });
  }, [products, priceFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiDeleteProduct(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {loading ? "Загрузка..." : `${filteredProducts.length} товаров${filteredProducts.length !== products.length ? ` из ${products.length}` : ""}`}
          </p>
        </div>
        <Link
          to={`${backPath}/new`}
          className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить товар
        </Link>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 mb-5 text-sm">
          {error} — убедитесь, что сервер запущен (<code>npm run server</code>)
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Поиск */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
          />
        </div>

        {/* Категория (тип) */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                {t === "all" ? "Все категории" : typeLabels[t as keyof typeof typeLabels]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Пол — скрываем если пол уже задан роутом */}
        {!routeGenderFilter && (
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Пол" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                  {g === "all" ? "Любой пол" : genderLabels[g as keyof typeof genderLabels]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Цена */}
        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-44 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Цена" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {PRICE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Сезон */}
        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Сезон" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {SEASONS.map((s) => (
              <SelectItem key={s} value={s} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                {s === "all" ? "Все сезоны" : seasonLabels[s as keyof typeof seasonLabels]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Статус */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Сброс фильтров */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white gap-2"
          >
            <X className="w-4 h-4" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3">ID</th>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3">Название</th>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">Категория</th>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Пол</th>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3">Цена</th>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Сезон</th>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3 hidden md:table-cell">Статус</th>
              <th className="text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-5 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                  {hasActiveFilters ? "Нет товаров, соответствующих фильтрам" : "Товары не найдены"}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                  <td className="px-5 py-4 text-gray-500 text-sm">#{product.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
                          {product.sizes.slice(0, 4).join(", ")}
                          {product.sizes.length > 4 && "..."}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-300 text-sm hidden md:table-cell">{typeLabels[product.type as keyof typeof typeLabels]}</td>
                  <td className="px-5 py-4 text-gray-300 text-sm hidden lg:table-cell">
                    {(() => {
                      const gender = normalizeGenderValue(product.gender);
                      return gender ? genderLabels[gender] : product.gender;
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-white text-sm font-medium">{formatPrice(product.price)}</p>
                      {product.old_price && (
                        <p className="text-gray-500 text-xs line-through">{formatPrice(product.old_price)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-300 text-sm hidden lg:table-cell">{seasonLabels[product.season as keyof typeof seasonLabels]}</td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {product.old_price !== null && product.old_price > product.price && (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 text-xs px-2 py-1 rounded-full">
                          <Tag className="w-3 h-3" />
                          Скидка
                        </span>
                      )}
                      {product.is_new && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs px-2 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Новинка
                        </span>
                      )}
                      {!product.is_new && !(product.old_price !== null && product.old_price > product.price) && (
                        <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded-full">
                          <Tag className="w-3 h-3" />
                          Обычный
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`${backPath}/${product.id}/edit`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Это действие нельзя отменить. Товар будет удалён из базы данных.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
