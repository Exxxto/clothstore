import { useCallback, useEffect, useState, type ComponentType } from "react";
import { RefreshCw, Search, Eye, ShoppingBag, Clock3, PackageCheck, Truck, CircleDot } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGetOrder, apiGetOrders, apiUpdateOrderStatus, type OrderDetails, type OrderSummary } from "../api";

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новый" },
  { value: "confirmed", label: "Подтверждён" },
  { value: "packing", label: "Сборка" },
  { value: "shipped", label: "Отправлен" },
  { value: "completed", label: "Завершён" },
  { value: "cancelled", label: "Отменён" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  packing: "Сборка",
  shipped: "Отправлен",
  completed: "Завершён",
  cancelled: "Отменён",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-400",
  confirmed: "bg-amber-500/10 text-amber-400",
  packing: "bg-violet-500/10 text-violet-400",
  shipped: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-rose-500/10 text-rose-400",
};

const STATUS_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  new: CircleDot,
  confirmed: Clock3,
  packing: PackageCheck,
  shipped: Truck,
  completed: PackageCheck,
  cancelled: CircleDot,
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Ошибка оплаты",
  refunded: "Возврат",
};

const PAYMENT_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300",
  paid: "bg-emerald-500/10 text-emerald-300",
  failed: "bg-rose-500/10 text-rose-300",
  refunded: "bg-blue-500/10 text-blue-300",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount) + " ₽";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCustomerLabel(order: Pick<OrderSummary, "customer_display_name" | "customer_name" | "email">) {
  return order.customer_display_name || order.customer_name || order.email || "Без имени";
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [statusDraft, setStatusDraft] = useState("new");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetOrders({
        status: statusFilter,
        search: search.trim() || undefined,
        limit: 200,
      });
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadOrders]);

  const openDetails = async (orderId: number) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setError("");
    try {
      const data = await apiGetOrder(orderId);
      setSelectedOrder(data);
      setStatusDraft(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки заказа");
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveStatus = async () => {
    if (!selectedOrder) return;

    setSavingStatus(true);
    setError("");
    try {
      const result = await apiUpdateOrderStatus(selectedOrder.id, statusDraft);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: result.status, updated_at: result.updated_at }
            : order
        )
      );
      setSelectedOrder((prev) =>
        prev
          ? { ...prev, status: result.status, updated_at: result.updated_at }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления статуса");
    } finally {
      setSavingStatus(false);
    }
  };

  const refresh = async () => {
    await loadOrders();
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Заказы</h1>
          <p className="text-gray-400 mt-1 text-sm">Контроль статусов, состава и суммы заказа</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={refresh}
          className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клиенту, email или телефону"
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52 bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Список заказов</h2>
            <p className="text-gray-400 text-sm">{loading ? "Загрузка..." : `${orders.length} заказов`}</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <ShoppingBag className="w-4 h-4" />
            {statusFilter === "all" ? "Все статусы" : STATUS_LABELS[statusFilter] || statusFilter}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Заказ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Клиент</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ID клиента</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Контакты</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Товары</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    {[...Array(8)].map((__, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4">
                        <div className="h-4 rounded bg-gray-700 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-gray-500">
                    Заказы не найдены
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const StatusIcon = STATUS_ICONS[order.status] || CircleDot;
                  return (
                    <tr key={order.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">#{order.id}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{formatDate(order.created_at)}</p>
                        {order.is_test ? (
                          <span className="mt-2 inline-flex rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[11px] font-medium text-fuchsia-300">
                            E2E {order.test_run_id || "test"}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">{getCustomerLabel(order)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{order.customer_name || "Гость"}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm font-medium">
                        {order.user_id ? `#${order.user_id}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        <div className="space-y-1">
                          <p>{order.email || order.user_email || "Нет email"}</p>
                          <p>{order.phone || "Нет телефона"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm font-medium">
                        <div className="space-y-2">
                          <p>{formatAmount(order.total_amount)}</p>
                          {order.payment_status ? (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_CLASSES[order.payment_status] || "bg-gray-700 text-gray-300"}`}>
                              {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[order.status] || "bg-gray-700 text-gray-300"}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{order.items_count}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(order.id)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                            Подробнее
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Детали заказа</DialogTitle>
            <DialogDescription className="text-gray-400">
              {detailsLoading ? "Загрузка данных заказа..." : selectedOrder ? `Заказ #${selectedOrder.id}` : "Информация о заказе"}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading || !selectedOrder ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-10 rounded bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Клиент</p>
                  <p className="mt-2 text-white font-medium">{getCustomerLabel(selectedOrder)}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    ID клиента: {selectedOrder.user_id ? `#${selectedOrder.user_id}` : "Гость"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{selectedOrder.email || selectedOrder.user_email || "Нет email"}</p>
                  <p className="text-sm text-gray-400">{selectedOrder.phone || "Нет телефона"}</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Доставка и оплата</p>
                  <p className="mt-2 text-white text-sm">{selectedOrder.delivery_method || "Не указано"}</p>
                  <p className="text-gray-400 text-sm">{selectedOrder.payment_method || "Не указано"}</p>
                  <p className="text-gray-400 text-sm">
                    Оплата: {selectedOrder.payment_status ? PAYMENT_STATUS_LABELS[selectedOrder.payment_status] || selectedOrder.payment_status : "Не указано"}
                    {selectedOrder.payment_provider ? ` · ${selectedOrder.payment_provider}` : ""}
                  </p>
                  {selectedOrder.payment_reference ? (
                    <p className="text-gray-500 text-xs">Ref: {selectedOrder.payment_reference}</p>
                  ) : null}
                  {(selectedOrder.carrier || selectedOrder.tracking_number) ? (
                    <p className="text-gray-400 text-sm">
                      Трекинг: {[selectedOrder.carrier, selectedOrder.tracking_number].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {selectedOrder.is_test ? (
                    <p className="mt-2 inline-flex rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[11px] font-medium text-fuchsia-300">
                      Тестовый заказ {selectedOrder.test_run_id || ""}
                    </p>
                  ) : null}
                  <p className="text-gray-400 text-sm mt-1">{selectedOrder.delivery_address || "Адрес не указан"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Статус заказа</p>
                    <p className="text-white font-medium mt-1">{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={statusDraft} onValueChange={setStatusDraft}>
                      <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-800 focus:bg-gray-800">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={saveStatus}
                      disabled={savingStatus || statusDraft === selectedOrder.status}
                      className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                    >
                      {savingStatus ? "Сохранение..." : "Сохранить статус"}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Состав заказа</h3>
                  <p className="text-sm text-gray-400">{selectedOrder.items.length} позиций</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-700">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-800">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Товар</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Размер</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Кол-во</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Цена</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Итого</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-700/50 bg-gray-900">
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium">{item.product_name}</p>
                            <p className="text-gray-500 text-xs">ID товара: {item.product_id ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-sm">{item.size || "—"}</td>
                          <td className="px-4 py-3 text-gray-300 text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-gray-300 text-sm">{formatAmount(item.product_price)}</td>
                          <td className="px-4 py-3 text-white text-sm font-medium">
                            {formatAmount(item.product_price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Комментарий</p>
                  <p className="text-sm text-gray-300 mt-1">{selectedOrder.comment || "Без комментария"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-gray-500">Общая сумма</p>
                  <p className="text-xl font-semibold text-white">{formatAmount(selectedOrder.total_amount)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
