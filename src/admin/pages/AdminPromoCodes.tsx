import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  apiCreatePromoCode,
  apiDeletePromoCode,
  apiGetPromoCodes,
  apiUpdatePromoCode,
  type PromoCode,
} from "../api";

type PromoFormState = {
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: string;
  usage_limit: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const emptyForm: PromoFormState = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: "",
  usage_limit: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromoFormState>(emptyForm);

  const loadPromoCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetPromoCodes();
      setPromoCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки промокодов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPromoCodes();
  }, [loadPromoCodes]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type as "percent" | "fixed",
      discount_value: promo.discount_value,
      min_order_amount: promo.min_order_amount,
      max_discount_amount: promo.max_discount_amount ? String(promo.max_discount_amount) : "",
      usage_limit: promo.usage_limit ? String(promo.usage_limit) : "",
      starts_at: promo.starts_at ? promo.starts_at.slice(0, 16) : "",
      ends_at: promo.ends_at ? promo.ends_at.slice(0, 16) : "",
      is_active: promo.is_active,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
      };

      if (editingId) {
        await apiUpdatePromoCode(editingId, payload);
      } else {
        await apiCreatePromoCode(payload);
      }

      await loadPromoCodes();
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения промокода");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo: PromoCode) => {
    if (!window.confirm(`Удалить промокод "${promo.code}"?`)) {
      return;
    }

    setError("");
    try {
      await apiDeletePromoCode(promo.id);
      await loadPromoCodes();
      if (editingId === promo.id) {
        startCreate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления промокода");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Промокоды</h1>
          <p className="mt-1 text-sm text-gray-400">Скидки, лимиты использования и сроки действия</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadPromoCodes()}
            className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button type="button" onClick={startCreate} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
            <Plus className="mr-2 h-4 w-4" />
            Новый промокод
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
              <BadgePercent className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{editingId ? "Редактирование промокода" : "Создание промокода"}</h2>
              <p className="text-sm text-gray-400">Правила и ограничения скидки</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300">Код *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME10"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Тип скидки</Label>
                <Select value={form.discount_type} onValueChange={(value) => setForm((prev) => ({ ...prev, discount_type: value as "percent" | "fixed" }))}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="percent" className="text-white focus:bg-gray-700">Процент</SelectItem>
                    <SelectItem value="fixed" className="text-white focus:bg-gray-700">Фиксированная сумма</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Значение скидки</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.discount_value}
                  onChange={(e) => setForm((prev) => ({ ...prev, discount_value: Number(e.target.value) || 0 }))}
                  className="border-gray-700 bg-gray-900 text-white focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Минимальный заказ</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_order_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, min_order_amount: Number(e.target.value) || 0 }))}
                  className="border-gray-700 bg-gray-900 text-white focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Макс. скидка</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_discount_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_discount_amount: e.target.value }))}
                  className="border-gray-700 bg-gray-900 text-white focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Лимит использований</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.usage_limit}
                  onChange={(e) => setForm((prev) => ({ ...prev, usage_limit: e.target.value }))}
                  className="border-gray-700 bg-gray-900 text-white focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Активность</Label>
                <div className="flex h-10 items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4">
                  <span className="text-sm text-white">{form.is_active ? "Активен" : "Отключен"}</span>
                  <Switch checked={form.is_active} onCheckedChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Старт</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))}
                  className="border-gray-700 bg-gray-900 text-white focus:border-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Окончание</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))}
                  className="border-gray-700 bg-gray-900 text-white focus:border-white"
                />
              </div>
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
              <h2 className="font-semibold text-white">Список промокодов</h2>
              <p className="text-sm text-gray-400">{loading ? "Загрузка..." : `${promoCodes.length} промокодов`}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <BadgePercent className="h-4 w-4" />
              Скидки
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Код</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Скидка</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Лимиты</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Исп.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      {[...Array(6)].map((__, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4">
                          <div className="h-4 animate-pulse rounded bg-gray-700" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-gray-500">
                      Промокоды пока не созданы
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promo) => (
                    <tr key={promo.id} className="border-b border-gray-700/50 transition-colors hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{promo.code}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{promo.description || "Без описания"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {promo.discount_type === "percent" ? `${promo.discount_value}%` : formatMoney(promo.discount_value)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        мин. {formatMoney(promo.min_order_amount)}
                        {promo.max_discount_amount ? ` · макс. ${formatMoney(promo.max_discount_amount)}` : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {promo.usage_count}
                        {promo.usage_limit ? ` / ${promo.usage_limit}` : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${promo.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                          {promo.is_active ? "Активен" : "Отключен"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(promo)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(promo)}
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
