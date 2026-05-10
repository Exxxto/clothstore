import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  apiCreateWarehouse,
  apiDeleteWarehouse,
  apiGetWarehouses,
  apiUpdateWarehouse,
  type Warehouse,
} from "../api";

type WarehouseFormState = {
  name: string;
  code: string;
  city: string;
  address: string;
  is_active: boolean;
};

const emptyForm: WarehouseFormState = {
  name: "",
  code: "",
  city: "",
  address: "",
  is_active: true,
};

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WarehouseFormState>(emptyForm);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetWarehouses();
      setWarehouses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки складов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setForm({
      name: warehouse.name,
      code: warehouse.code,
      city: warehouse.city || "",
      address: warehouse.address || "",
      is_active: warehouse.is_active,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        await apiUpdateWarehouse(editingId, payload);
      } else {
        await apiCreateWarehouse(payload);
      }

      await loadWarehouses();
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения склада");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (!window.confirm(`Удалить склад "${warehouse.name}"?`)) {
      return;
    }

    setError("");
    try {
      await apiDeleteWarehouse(warehouse.id);
      await loadWarehouses();
      if (editingId === warehouse.id) {
        startCreate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления склада");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Склады</h1>
          <p className="mt-1 text-sm text-gray-400">Точки хранения и выдачи товара</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadWarehouses()}
            className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button type="button" onClick={startCreate} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Новый склад
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
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{editingId ? "Редактирование склада" : "Создание склада"}</h2>
              <p className="text-sm text-gray-400">Управление локациями хранения</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300">Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Основной склад"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Код</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="MAIN"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Город</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Екатеринбург"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Адрес</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                rows={4}
                placeholder="Полный адрес склада"
                className="resize-none border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Склад активен</p>
                <p className="text-xs text-gray-500">Неактивный склад не используется в текущей работе.</p>
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
              <h2 className="font-semibold text-white">Список складов</h2>
              <p className="text-sm text-gray-400">{loading ? "Загрузка..." : `${warehouses.length} складов`}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="h-4 w-4" />
              Складские точки
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Склад</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Код</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Остатки</th>
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
                ) : warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-gray-500">
                      Склады пока не созданы
                    </td>
                  </tr>
                ) : (
                  warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="border-b border-gray-700/50 transition-colors hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{warehouse.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {[warehouse.city, warehouse.address].filter(Boolean).join(", ") || "Адрес не указан"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{warehouse.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {(warehouse.total_items ?? 0).toLocaleString("ru-RU")} шт.
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${warehouse.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                          {warehouse.is_active ? "Активен" : "Архив"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(warehouse)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(warehouse)}
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
