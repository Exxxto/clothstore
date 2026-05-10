import { useCallback, useEffect, useState } from "react";
import { CreditCard, Pencil, Plus, RefreshCw, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  apiCreatePaymentMethod,
  apiCreateShippingMethod,
  apiDeletePaymentMethod,
  apiDeleteShippingMethod,
  apiGetCheckoutMethods,
  apiUpdatePaymentMethod,
  apiUpdateShippingMethod,
  type AdminPaymentMethod,
  type AdminShippingMethod,
} from "../api";

type ShippingFormState = {
  code: string;
  name: string;
  description: string;
  price: number;
  sort_order: number;
  is_active: boolean;
};

type PaymentFormState = {
  code: string;
  name: string;
  description: string;
  requires_card: boolean;
  sort_order: number;
  is_active: boolean;
};

const emptyShippingForm: ShippingFormState = {
  code: "",
  name: "",
  description: "",
  price: 0,
  sort_order: 10,
  is_active: true,
};

const emptyPaymentForm: PaymentFormState = {
  code: "",
  name: "",
  description: "",
  requires_card: false,
  sort_order: 10,
  is_active: true,
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export default function AdminCheckoutMethods() {
  const [shippingMethods, setShippingMethods] = useState<AdminShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<AdminPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingShippingId, setEditingShippingId] = useState<number | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [shippingForm, setShippingForm] = useState<ShippingFormState>(emptyShippingForm);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await apiGetCheckoutMethods();
      setShippingMethods(payload.shipping_methods);
      setPaymentMethods(payload.payment_methods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки способов оформления");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  const resetShipping = () => {
    setEditingShippingId(null);
    setShippingForm(emptyShippingForm);
  };

  const resetPayment = () => {
    setEditingPaymentId(null);
    setPaymentForm(emptyPaymentForm);
  };

  const startEditShipping = (method: AdminShippingMethod) => {
    setEditingShippingId(method.id);
    setShippingForm({
      code: method.code,
      name: method.name,
      description: method.description || "",
      price: method.price,
      sort_order: method.sort_order,
      is_active: method.is_active,
    });
  };

  const startEditPayment = (method: AdminPaymentMethod) => {
    setEditingPaymentId(method.id);
    setPaymentForm({
      code: method.code,
      name: method.name,
      description: method.description || "",
      requires_card: method.requires_card,
      sort_order: method.sort_order,
      is_active: method.is_active,
    });
  };

  const saveShipping = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: shippingForm.code.trim(),
        name: shippingForm.name.trim(),
        description: shippingForm.description.trim() || null,
        price: shippingForm.price,
        sort_order: shippingForm.sort_order,
        is_active: shippingForm.is_active,
      };

      if (editingShippingId) {
        await apiUpdateShippingMethod(editingShippingId, payload);
      } else {
        await apiCreateShippingMethod(payload);
      }

      await loadMethods();
      resetShipping();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения доставки");
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: paymentForm.code.trim(),
        name: paymentForm.name.trim(),
        description: paymentForm.description.trim() || null,
        requires_card: paymentForm.requires_card,
        sort_order: paymentForm.sort_order,
        is_active: paymentForm.is_active,
      };

      if (editingPaymentId) {
        await apiUpdatePaymentMethod(editingPaymentId, payload);
      } else {
        await apiCreatePaymentMethod(payload);
      }

      await loadMethods();
      resetPayment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения оплаты");
    } finally {
      setSaving(false);
    }
  };

  const deleteShipping = async (method: AdminShippingMethod) => {
    if (!window.confirm(`Удалить способ доставки "${method.name}"?`)) return;

    try {
      await apiDeleteShippingMethod(method.id);
      await loadMethods();
      if (editingShippingId === method.id) resetShipping();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления доставки");
    }
  };

  const deletePayment = async (method: AdminPaymentMethod) => {
    if (!window.confirm(`Удалить способ оплаты "${method.name}"?`)) return;

    try {
      await apiDeletePaymentMethod(method.id);
      await loadMethods();
      if (editingPaymentId === method.id) resetPayment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления оплаты");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Доставка и оплата</h1>
          <p className="mt-1 text-sm text-gray-400">Методы, доступные покупателю на checkout</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadMethods()}
          className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-white">{editingShippingId ? "Редактирование доставки" : "Новый способ доставки"}</h2>
                <p className="text-sm text-gray-400">Код, название, цена и порядок вывода</p>
              </div>
            </div>

            <form onSubmit={saveShipping} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300">Код *</Label>
                  <Input
                    value={shippingForm.code}
                    onChange={(e) => setShippingForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="courier"
                    className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Название *</Label>
                  <Input
                    value={shippingForm.name}
                    onChange={(e) => setShippingForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Курьер"
                    className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Описание</Label>
                <Textarea
                  value={shippingForm.description}
                  onChange={(e) => setShippingForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="resize-none border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">Цена, ₽</Label>
                  <Input
                    type="number"
                    min={0}
                    value={shippingForm.price}
                    onChange={(e) => setShippingForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    className="border-gray-700 bg-gray-900 text-white focus:border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Сортировка</Label>
                  <Input
                    type="number"
                    value={shippingForm.sort_order}
                    onChange={(e) => setShippingForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                    className="border-gray-700 bg-gray-900 text-white focus:border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Активность</Label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4">
                    <span className="text-sm text-white">{shippingForm.is_active ? "Активен" : "Отключен"}</span>
                    <Switch checked={shippingForm.is_active} onCheckedChange={(value) => setShippingForm((prev) => ({ ...prev, is_active: value }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
                  {saving ? "Сохранение..." : editingShippingId ? "Сохранить" : "Создать"}
                </Button>
                <Button type="button" variant="outline" onClick={resetShipping} className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Новый
                </Button>
              </div>
            </form>
          </div>

          <MethodsTable
            title="Способы доставки"
            loading={loading}
            rows={shippingMethods}
            emptyText="Способы доставки пока не созданы"
            renderMeta={(method) => `${formatMoney(method.price)} · сорт. ${method.sort_order}`}
            onEdit={startEditShipping}
            onDelete={(method) => void deleteShipping(method)}
          />
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-white">{editingPaymentId ? "Редактирование оплаты" : "Новый способ оплаты"}</h2>
                <p className="text-sm text-gray-400">Доступность и требование карточных полей</p>
              </div>
            </div>

            <form onSubmit={savePayment} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300">Код *</Label>
                  <Input
                    value={paymentForm.code}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="card"
                    className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Название *</Label>
                  <Input
                    value={paymentForm.name}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Банковская карта"
                    className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Описание</Label>
                <Textarea
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="resize-none border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">Сортировка</Label>
                  <Input
                    type="number"
                    value={paymentForm.sort_order}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
                    className="border-gray-700 bg-gray-900 text-white focus:border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Карта</Label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4">
                    <span className="text-sm text-white">{paymentForm.requires_card ? "Нужна" : "Не нужна"}</span>
                    <Switch checked={paymentForm.requires_card} onCheckedChange={(value) => setPaymentForm((prev) => ({ ...prev, requires_card: value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Активность</Label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4">
                    <span className="text-sm text-white">{paymentForm.is_active ? "Активен" : "Отключен"}</span>
                    <Switch checked={paymentForm.is_active} onCheckedChange={(value) => setPaymentForm((prev) => ({ ...prev, is_active: value }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
                  {saving ? "Сохранение..." : editingPaymentId ? "Сохранить" : "Создать"}
                </Button>
                <Button type="button" variant="outline" onClick={resetPayment} className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Новый
                </Button>
              </div>
            </form>
          </div>

          <MethodsTable
            title="Способы оплаты"
            loading={loading}
            rows={paymentMethods}
            emptyText="Способы оплаты пока не созданы"
            renderMeta={(method) => `${method.requires_card ? "Требует карту" : "Без карты"} · сорт. ${method.sort_order}`}
            onEdit={startEditPayment}
            onDelete={(method) => void deletePayment(method)}
          />
        </section>
      </div>
    </div>
  );
}

function MethodsTable<T extends { id: number; code: string; name: string; description: string | null; is_active: boolean }>({
  title,
  loading,
  rows,
  emptyText,
  renderMeta,
  onEdit,
  onDelete,
}: {
  title: string;
  loading: boolean;
  rows: T[];
  emptyText: string;
  renderMeta: (row: T) => string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
      <div className="border-b border-gray-700 px-6 py-5">
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{loading ? "Загрузка..." : `${rows.length} записей`}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Метод</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Параметры</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <tr key={index} className="border-b border-gray-700/50">
                  {[...Array(4)].map((__, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4">
                      <div className="h-4 animate-pulse rounded bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-14 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-700/50 transition-colors hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{row.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{row.code}</p>
                    {row.description ? <p className="mt-1 text-xs text-gray-400">{row.description}</p> : null}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{renderMeta(row)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                      {row.is_active ? "Активен" : "Отключен"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onEdit(row)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white" title="Редактировать">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(row)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-950/30 hover:text-red-400" title="Удалить">
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
  );
}
