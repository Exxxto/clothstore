import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DBProduct, ProductInput, apiCreateProduct, apiGetCategories, apiUpdateProduct, apiUploadProductImage, type Category } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Upload, ImageIcon, ShoppingCart, Heart } from "lucide-react";
import { formatPrice, genderLabels, seasonLabels, typeLabels } from "@/data/products";
import { normalizeGenderValue } from "@/lib/productNormalization";
import { getSuggestedCategoryId } from "../lib/productCategories";

const GENDERS = ["men", "women", "kids"];
const TYPES = ["tshirts", "jeans", "jackets", "sneakers", "sweaters", "dresses", "pants", "shirts", "hoodies", "skirts"];
const SEASONS = ["spring", "summer", "autumn", "winter"];

interface ProductFormProps {
  product?: DBProduct;
  backPath: string;
}

export default function ProductForm({ product, backPath }: ProductFormProps) {
  const navigate = useNavigate();
  const isEdit = !!product;
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState<ProductInput>({
    name: product?.name || "",
    type: product?.type || "tshirts",
    gender: normalizeGenderValue(product?.gender) || "men",
    price: product?.price || 0,
    old_price: product?.old_price || null,
    image_url: product?.image_url || "",
    season: product?.season || "spring",
    category_id: product?.category_id ?? null,
    is_new: product?.is_new || false,
    sizes: product?.sizes || [],
    description: product?.description || "",
  });

  const [sizeInput, setSizeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    apiGetCategories()
      .then((rows) => { if (!active) return; setCategories(rows); })
      .catch(() => { if (!active) return; setCategories([]); })
      .finally(() => { if (active) setCategoriesLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const suggestedCategoryId = getSuggestedCategoryId(form.type, categories);
    if (!form.category_id && suggestedCategoryId) {
      setForm((prev) => ({ ...prev, category_id: suggestedCategoryId }));
    }
  }, [categories, form.category_id, form.type]);

  const set = <K extends keyof ProductInput>(field: K, value: ProductInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSize = () => {
    const s = sizeInput.trim().toUpperCase();
    if (s && !form.sizes.includes(s)) set("sizes", [...form.sizes, s]);
    setSizeInput("");
  };

  const removeSize = (size: string) => {
    set("sizes", form.sizes.filter((s) => s !== size));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const { url } = await apiUploadProductImage(file, form.gender);
      set("image_url", url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const categoryId = form.category_id ?? getSuggestedCategoryId(form.type, categories);
      const payload: ProductInput = { ...form, category_id: categoryId ?? null };
      if (isEdit && product) {
        await apiUpdateProduct(product.id, payload);
      } else {
        await apiCreateProduct(payload);
      }
      navigate(backPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  // Preview card data
  const previewImage = form.image_url || null;
  const previewName = form.name || "Название товара";
  const previewType = typeLabels[form.type as keyof typeof typeLabels] || form.type;
  const previewGender = genderLabels[normalizeGenderValue(form.gender) || "men"];
  const previewPrice = form.price;
  const previewOldPrice = form.old_price;
  const previewIsNew = form.is_new;

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-6 min-w-0">
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-gray-300">Название *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Базовая футболка"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
              required
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-gray-300">Пол *</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                    {genderLabels[g as keyof typeof genderLabels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category type */}
          <div className="space-y-2">
            <Label className="text-gray-300">Категория *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => {
                set("type", v);
                const suggestedCategoryId = getSuggestedCategoryId(v, categories);
                if (suggestedCategoryId) set("category_id", suggestedCategoryId);
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                    {typeLabels[t as keyof typeof typeLabels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {categoriesLoading
                ? "Связанная категория загружается..."
                : (() => {
                    const linkedCategory = categories.find((c) => c.id === form.category_id);
                    return linkedCategory
                      ? `Связь с категорией каталога: ${linkedCategory.name}`
                      : "Связь с категорией каталога подставится автоматически.";
                  })()}
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-gray-300">Цена (₽) *</Label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set("price", parseInt(e.target.value) || 0)}
              className="bg-gray-800 border-gray-700 text-white focus:border-white"
              required
            />
          </div>

          {/* Old price */}
          <div className="space-y-2">
            <Label className="text-gray-300">Старая цена (₽)</Label>
            <Input
              type="number"
              min={0}
              value={form.old_price ?? ""}
              onChange={(e) => set("old_price", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Оставьте пустым если нет скидки"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
            />
          </div>

          {/* Season */}
          <div className="space-y-2">
            <Label className="text-gray-300">Сезон *</Label>
            <Select value={form.season} onValueChange={(v) => set("season", v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {SEASONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                    {seasonLabels[s as keyof typeof seasonLabels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Is New */}
          <div className="space-y-2">
            <Label className="text-gray-300">Новинка</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch checked={form.is_new} onCheckedChange={(v) => set("is_new", v)} />
              <span className="text-gray-400 text-sm">{form.is_new ? "Да" : "Нет"}</span>
            </div>
          </div>

          {/* Image */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-gray-300">Изображение товара</Label>
            <div className="flex gap-2">
              <Input
                value={form.image_url ?? ""}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="/assets/products/catalog/men-tshirts-001.jpg"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="shrink-0 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Загрузка..." : "Загрузить"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {uploadError && (
              <p className="text-xs text-red-400">{uploadError}</p>
            )}
            <p className="text-xs text-gray-500">
              Загрузите файл (jpg, png, webp) или введите путь вручную
            </p>
          </div>

          {/* Sizes */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-gray-300">Размеры</Label>
            <div className="flex gap-2">
              <Input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
                placeholder="S, M, L, XL, 42, 44..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
              />
              <Button
                type="button"
                onClick={addSize}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.sizes.map((size) => (
                  <span key={size} className="flex items-center gap-1 bg-gray-700 text-gray-200 text-sm px-3 py-1 rounded-full">
                    {size}
                    <button type="button" onClick={() => removeSize(size)} className="text-gray-400 hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-gray-300">Описание</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Описание товара..."
              rows={3}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
          >
            {loading ? "Сохранение..." : isEdit ? "Сохранить изменения" : "Создать товар"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(backPath)}
            className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
          >
            Отмена
          </Button>
        </div>
      </form>

      {/* Live preview */}
      <div className="xl:w-72 shrink-0">
        <div className="sticky top-6">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-3">Предпросмотр карточки</p>
          <div className="group relative overflow-hidden border border-gray-700 bg-gray-900 rounded-2xl shadow-lg flex flex-col">
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-800 shrink-0">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={previewName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-600" />
                </div>
              )}
              {previewIsNew && (
                <div className="absolute left-3 top-3 px-2.5 py-1 text-[0.65rem] font-medium bg-white text-gray-900 rounded-full tracking-[0.12em]">
                  НОВИНКА
                </div>
              )}
              {previewOldPrice && (
                <div className="absolute right-3 top-3 px-2.5 py-1 text-[0.65rem] font-medium bg-red-500 text-white rounded-full tracking-[0.12em]">
                  СКИДКА
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex flex-col flex-1 gap-2 p-3">
              <p className="text-xs font-light text-gray-500 uppercase tracking-[0.14em] truncate">
                {previewType} · {previewGender}
              </p>
              <div className="flex items-start justify-between gap-2 flex-1">
                <h3 className="text-xs font-medium text-white leading-snug line-clamp-2">
                  {previewName}
                </h3>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-light text-white whitespace-nowrap">
                    {formatPrice(previewPrice)}
                  </p>
                  {previewOldPrice && (
                    <p className="text-xs font-light text-gray-500 line-through whitespace-nowrap">
                      {formatPrice(previewOldPrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-1">
                <button
                  type="button"
                  className="h-9 flex-1 rounded-full bg-white text-gray-900 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  В корзину
                </button>
                <button
                  type="button"
                  className="h-9 w-9 shrink-0 rounded-full border border-gray-600 flex items-center justify-center"
                >
                  <Heart className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">Обновляется в реальном времени</p>
        </div>
      </div>
    </div>
  );
}
