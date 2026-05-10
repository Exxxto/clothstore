import { useCallback, useEffect, useState } from "react";
import { Layers3, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  apiCreateCollection,
  apiDeleteCollection,
  apiGetCollections,
  apiUpdateCollection,
  type Collection,
} from "../api";

type CollectionFormState = {
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm: CollectionFormState = {
  name: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CollectionFormState>(emptyForm);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetCollections();
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки коллекций");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setForm({
      name: collection.name,
      description: collection.description || "",
      sort_order: collection.sort_order,
      is_active: collection.is_active,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      if (editingId) {
        await apiUpdateCollection(editingId, payload);
      } else {
        await apiCreateCollection(payload);
      }

      await loadCollections();
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения коллекции");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collection: Collection) => {
    if (!window.confirm(`Удалить коллекцию "${collection.name}"?`)) {
      return;
    }

    setError("");
    try {
      await apiDeleteCollection(collection.id);
      await loadCollections();
      if (editingId === collection.id) {
        startCreate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления коллекции");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Коллекции</h1>
          <p className="mt-1 text-sm text-gray-400">Подборки товаров для витрин, сезонов и кампаний</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCollections()}
            className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button type="button" onClick={startCreate} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Новая коллекция
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Layers3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{editingId ? "Редактирование коллекции" : "Создание коллекции"}</h2>
              <p className="text-sm text-gray-400">Управление подборками товаров</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300">Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Summer Capsule"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Краткое описание коллекции"
                className="resize-none border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Порядок сортировки</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                className="border-gray-700 bg-gray-900 text-white focus:border-white"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Коллекция активна</p>
                <p className="text-xs text-gray-500">Неактивные коллекции можно держать в архиве.</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
                {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={startCreate}
                className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
              >
                Сбросить
              </Button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
            <div>
              <h2 className="font-semibold text-white">Список коллекций</h2>
              <p className="text-sm text-gray-400">{loading ? "Загрузка..." : `${collections.length} коллекций`}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Layers3 className="h-4 w-4" />
              Подборки
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Товары</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Порядок</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      {[...Array(5)].map((__, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4">
                          <div className="h-4 animate-pulse rounded bg-gray-700" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : collections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-gray-500">
                      Коллекции пока не созданы
                    </td>
                  </tr>
                ) : (
                  collections.map((collection) => (
                    <tr key={collection.id} className="border-b border-gray-700/50 transition-colors hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{collection.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{collection.description || "Без описания"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{collection.product_count ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{collection.sort_order}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${collection.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                          {collection.is_active ? "Активна" : "Архив"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(collection)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(collection)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-950/30 hover:text-red-400"
                            title="Удалить"
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
      </div>
    </div>
  );
}
