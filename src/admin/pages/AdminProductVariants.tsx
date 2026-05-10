import { useCallback, useEffect, useMemo, useState } from "react";
import { Package2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  apiCreateProductVariant,
  apiDeactivateProductVariant,
  apiGetProductVariant,
  apiGetProductVariants,
  apiGetProducts,
  apiUpdateProductVariant,
  type DBProduct,
  type ProductVariant,
  type ProductVariantDetails,
} from "../api";

type VariantFormState = {
  product_id: number | "";
  variant_name: string;
  sku: string;
  size: string;
  color: string;
  barcode: string;
  price: number;
  old_price: string;
  cost_price: string;
  stock_tracking: boolean;
  is_active: boolean;
};

const emptyForm: VariantFormState = {
  product_id: "",
  variant_name: "",
  sku: "",
  size: "",
  color: "",
  barcode: "",
  price: 0,
  old_price: "",
  cost_price: "",
  stock_tracking: true,
  is_active: true,
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export default function AdminProductVariants() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantDetails | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyForm);

  const loadProducts = useCallback(async () => {
    const productRows = await apiGetProducts();
    setProducts(productRows);
  }, []);

  const loadVariants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await apiGetProductVariants({
        search: search.trim() || undefined,
        active: activeFilter,
        product_id: selectedProductFilter !== "all" ? Number(selectedProductFilter) : undefined,
      });
      setVariants(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки вариантов");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search, selectedProductFilter]);

  useEffect(() => {
    void Promise.all([loadProducts(), loadVariants()]);
  }, [loadProducts, loadVariants]);

  const openCreateDialog = () => {
    setEditingVariant(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = async (variantId: number) => {
    setSaving(true);
    setError("");
    try {
      const variant = await apiGetProductVariant(variantId);
      setEditingVariant(variant);
      setForm({
        product_id: variant.product_id,
        variant_name: variant.variant_name,
        sku: variant.sku,
        size: variant.size || "",
        color: variant.color || "",
        barcode: variant.barcode || "",
        price: variant.price,
        old_price: variant.old_price ? String(variant.old_price) : "",
        cost_price: variant.cost_price ? String(variant.cost_price) : "",
        stock_tracking: variant.stock_tracking,
        is_active: variant.is_active,
      });
      setDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки варианта");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.product_id || !form.variant_name.trim() || !form.price) {
      setError("Укажите товар, название варианта и цену");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        product_id: Number(form.product_id),
        variant_name: form.variant_name.trim(),
        sku: form.sku.trim() || undefined,
        size: form.size.trim() || null,
        color: form.color.trim() || null,
        barcode: form.barcode.trim() || null,
        price: form.price,
        old_price: form.old_price ? Number(form.old_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        stock_tracking: form.stock_tracking,
        is_active: form.is_active,
      };

      if (editingVariant) {
        await apiUpdateProductVariant(editingVariant.id, {
          variant_name: payload.variant_name,
          sku: payload.sku,
          size: payload.size,
          color: payload.color,
          barcode: payload.barcode,
          price: payload.price,
          old_price: payload.old_price,
          cost_price: payload.cost_price,
          stock_tracking: payload.stock_tracking,
          is_active: payload.is_active,
        });
      } else {
        await apiCreateProductVariant(payload);
      }

      setDialogOpen(false);
      setEditingVariant(null);
      setForm(emptyForm);
      await loadVariants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения варианта");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (variant: ProductVariant) => {
    if (!window.confirm(`Деактивировать вариант "${variant.variant_name}"?`)) {
      return;
    }

    setError("");
    try {
      await apiDeactivateProductVariant(variant.id);
      await loadVariants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка деактивации варианта");
    }
  };

  const selectedProductName = useMemo(
    () => products.find((product) => product.id === Number(form.product_id))?.name || "",
    [form.product_id, products]
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Варианты товаров</h1>
          <p className="mt-1 text-sm text-gray-400">SKU, размеры, цвета и отдельные товарные позиции</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadVariants()}
            className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button type="button" onClick={openCreateDialog} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Новый вариант
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-72 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по SKU, названию, размеру или цвету"
            className="border-gray-700 bg-gray-800 pl-9 text-white placeholder:text-gray-500 focus:border-white"
          />
        </div>
        <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
          <SelectTrigger className="w-72 border-gray-700 bg-gray-800 text-white">
            <SelectValue placeholder="Товар" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-800">
            <SelectItem value="all" className="text-white focus:bg-gray-700">Все товары</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={String(product.id)} className="text-white focus:bg-gray-700">
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "true" | "false")}>
          <SelectTrigger className="w-44 border-gray-700 bg-gray-800 text-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-800">
            <SelectItem value="all" className="text-white focus:bg-gray-700">Все статусы</SelectItem>
            <SelectItem value="true" className="text-white focus:bg-gray-700">Активные</SelectItem>
            <SelectItem value="false" className="text-white focus:bg-gray-700">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
          <div>
            <h2 className="font-semibold text-white">Список вариантов</h2>
            <p className="text-sm text-gray-400">{loading ? "Загрузка..." : `${variants.length} вариантов`}</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <Package2 className="h-4 w-4" />
            SKU и атрибуты
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">SKU / вариант</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Товар</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Размер / цвет</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Цена</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Остаток</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    {[...Array(7)].map((__, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-gray-500">
                    Варианты товаров не найдены
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr key={variant.id} className="border-b border-gray-700/50 transition-colors hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{variant.sku}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{variant.variant_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{variant.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {[variant.size, variant.color].filter(Boolean).join(" / ") || "Стандарт"}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{formatPrice(variant.price)}</p>
                        {variant.old_price ? <p className="text-xs text-gray-500 line-through">{formatPrice(variant.old_price)}</p> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{variant.total_stock ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${variant.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                        {variant.is_active ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => void openEditDialog(variant.id)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void handleDeactivate(variant)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-950/30 hover:text-red-400"
                          title="Деактивировать"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Редактирование варианта" : "Новый вариант товара"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300">Товар *</Label>
              <Select
                value={form.product_id ? String(form.product_id) : undefined}
                onValueChange={(value) => setForm((prev) => ({ ...prev, product_id: Number(value) }))}
                disabled={Boolean(editingVariant)}
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Выберите товар" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)} className="text-white focus:bg-gray-700">
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProductName ? <p className="text-xs text-gray-500">Выбран товар: {selectedProductName}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-300">Название варианта *</Label>
                <Input
                  value={form.variant_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, variant_name: e.target.value }))}
                  placeholder="Футболка / M / Черный"
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="TSHIRT-BLACK-M"
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Штрихкод</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))}
                  placeholder="4601234567890"
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Размер</Label>
                <Input
                  value={form.size}
                  onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                  placeholder="M"
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Цвет</Label>
                <Input
                  value={form.color}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="Черный"
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Цена *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  className="border-gray-700 bg-gray-800 text-white focus:border-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Старая цена</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.old_price}
                  onChange={(e) => setForm((prev) => ({ ...prev, old_price: e.target.value }))}
                  className="border-gray-700 bg-gray-800 text-white focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Себестоимость</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.cost_price}
                  onChange={(e) => setForm((prev) => ({ ...prev, cost_price: e.target.value }))}
                  className="border-gray-700 bg-gray-800 text-white focus:border-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Отслеживать остатки</p>
                  <p className="text-xs text-gray-500">Включает складской контроль по SKU.</p>
                </div>
                <Switch
                  checked={form.stock_tracking}
                  onCheckedChange={(value) => setForm((prev) => ({ ...prev, stock_tracking: value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Вариант активен</p>
                  <p className="text-xs text-gray-500">Неактивные SKU не участвуют в работе.</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
                {saving ? "Сохранение..." : editingVariant ? "Сохранить" : "Создать"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
              >
                Отмена
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
