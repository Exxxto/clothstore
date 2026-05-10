import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Tags, Package, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiCreateCategory, apiDeleteCategory, apiGetCategories, apiUpdateCategory, type Category } from "../api";

type CategoryFormState = {
  name: string;
  description: string;
  is_active: boolean;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  is_active: true,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки категорий");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        await apiUpdateCategory(editingId, payload);
      } else {
        await apiCreateCategory(payload);
      }

      await loadCategories();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения категории");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(`Удалить категорию "${category.name}"?`);
    if (!confirmed) return;

    setError("");
    try {
      await apiDeleteCategory(category.id);
      await loadCategories();
      if (editingId === category.id) {
        closeForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления категории");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Категории</h1>
          <p className="text-gray-400 mt-1 text-sm">Управление разделами каталога и их активностью</p>
        </div>
        <Button
          type="button"
          onClick={startCreate}
          className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Новая категория
        </Button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${showForm ? "xl:grid-cols-[380px_minmax(0,1fr)]" : ""}`}>
        {showForm && (
        <div ref={formRef} className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-fit">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Tags className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-white font-semibold">{editingId ? "Редактирование категории" : "Создание категории"}</h2>
                <p className="text-gray-400 text-sm">Полный контроль над структурой каталога</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300">Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Пальто"
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание категории"
                rows={4}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Категория активна</p>
                <p className="text-xs text-gray-500">Неактивные категории можно скрывать из каталога.</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={saving}
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
              >
                {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">Список категорий</h2>
              <p className="text-gray-400 text-sm">{loading ? "Загрузка..." : `${categories.length} категорий`}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Package className="w-4 h-4" />
              Привязка к товарам
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Товары</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      {[...Array(4)].map((__, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4">
                          <div className="h-4 rounded bg-gray-700 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-gray-500">
                      Категории пока не созданы
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm font-medium">{category.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{category.description || "Без описания"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{category.product_count ?? 0}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            category.is_active
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {category.is_active ? "Активна" : "Скрыта"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                            title="Редактировать"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-950/30 hover:text-red-400"
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
        </div>
      </div>
    </div>
  );
}
