import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Boxes, RefreshCw, Search } from "lucide-react";
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
  apiCreateStockMovement,
  apiGetInventoryBalances,
  apiGetStockMovements,
  apiGetWarehouses,
  type InventoryBalance,
  type StockMovement,
  type Warehouse,
} from "../api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminInventory() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<InventoryBalance | null>(null);
  const [movementType, setMovementType] = useState("adjustment");
  const [quantityDelta, setQuantityDelta] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [warehouseRows, balanceRows, movementRows] = await Promise.all([
        apiGetWarehouses(),
        apiGetInventoryBalances({
          warehouse_id: warehouseFilter !== "all" ? Number(warehouseFilter) : undefined,
          search: search.trim() || undefined,
          low_stock: lowStockOnly,
        }),
        apiGetStockMovements(40),
      ]);
      setWarehouses(warehouseRows);
      setBalances(balanceRows);
      setMovements(movementRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки остатков");
    } finally {
      setLoading(false);
    }
  }, [lowStockOnly, search, warehouseFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openMovementDialog = (balance: InventoryBalance) => {
    setSelectedBalance(balance);
    setMovementType("adjustment");
    setQuantityDelta("");
    setReason("");
    setNotes("");
    setDialogOpen(true);
  };

  const handleCreateMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBalance || !quantityDelta || Number(quantityDelta) === 0) {
      setError("Укажите изменение остатка");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await apiCreateStockMovement({
        warehouse_id: selectedBalance.warehouse_id,
        product_variant_id: selectedBalance.product_variant_id,
        quantity_delta: Number(quantityDelta),
        movement_type: movementType,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
      });
      setDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка записи движения");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const totalSkus = new Set(balances.map((balance) => balance.product_variant_id)).size;
    const lowStock = balances.filter((balance) => balance.quantity_on_hand <= balance.reorder_point).length;
    const totalUnits = balances.reduce((sum, balance) => sum + balance.quantity_on_hand, 0);
    return { totalSkus, lowStock, totalUnits };
  }, [balances]);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Остатки и движения</h1>
          <p className="mt-1 text-sm text-gray-400">Складские остатки по вариантам товара и журнал корректировок</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadData()}
          className="border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">SKU в учёте</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? "—" : stats.totalSkus}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">Всего единиц на руках</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? "—" : stats.totalUnits.toLocaleString("ru-RU")}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">Низкий остаток</p>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? "—" : stats.lowStock}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-72 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по товару, SKU, размеру или цвету"
            className="border-gray-700 bg-gray-800 pl-9 text-white placeholder:text-gray-500 focus:border-white"
          />
        </div>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-64 border-gray-700 bg-gray-800 text-white">
            <SelectValue placeholder="Склад" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-800">
            <SelectItem value="all" className="text-white focus:bg-gray-700">Все склады</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={String(warehouse.id)} className="text-white focus:bg-gray-700">
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
          <Switch checked={lowStockOnly} onCheckedChange={setLowStockOnly} />
          <span className="text-sm text-gray-200">Только низкий остаток</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
            <div>
              <h2 className="font-semibold text-white">Текущие остатки</h2>
              <p className="text-sm text-gray-400">{loading ? "Загрузка..." : `${balances.length} строк`}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Boxes className="h-4 w-4" />
              Склады и SKU
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Товар</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Склад</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">В наличии</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Резерв</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      {[...Array(6)].map((__, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4">
                          <div className="h-4 animate-pulse rounded bg-gray-700" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : balances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-gray-500">
                      Остатки не найдены
                    </td>
                  </tr>
                ) : (
                  balances.map((balance) => (
                    <tr key={balance.id} className="border-b border-gray-700/50 transition-colors hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{balance.product_name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{balance.variant_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{balance.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{balance.warehouse_name}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${balance.quantity_on_hand <= balance.reorder_point ? "text-amber-300" : "text-white"}`}>
                          {balance.quantity_on_hand}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{balance.quantity_reserved}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            onClick={() => openMovementDialog(balance)}
                            className="bg-white text-gray-900 hover:bg-gray-100"
                          >
                            Корректировка
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
          <div className="border-b border-gray-700 px-6 py-5">
            <h2 className="font-semibold text-white">Последние движения</h2>
            <p className="text-sm text-gray-400">Журнал последних складских операций</p>
          </div>

          <div className="max-h-[720px] overflow-y-auto">
            {loading ? (
              <div className="space-y-4 p-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-gray-700" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">Движений пока нет</div>
            ) : (
              <div className="space-y-3 p-4">
                {movements.map((movement) => (
                  <div key={movement.id} className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{movement.product_name}</p>
                        <p className="mt-1 text-xs text-gray-500">{movement.variant_name} · {movement.warehouse_name}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${movement.quantity_delta > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {movement.quantity_delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <span>{movement.reason || movement.movement_type}</span>
                      <span>{formatDate(movement.created_at)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Остаток после операции: {movement.quantity_after}
                      {movement.admin_username ? ` · ${movement.admin_username}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Складская корректировка</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateMovement} className="space-y-5">
            <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
              <p className="text-sm font-medium text-white">{selectedBalance?.product_name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {selectedBalance?.variant_name} · {selectedBalance?.warehouse_name} · Остаток сейчас: {selectedBalance?.quantity_on_hand ?? 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Тип движения</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem value="receipt" className="text-white focus:bg-gray-700">Поступление</SelectItem>
                  <SelectItem value="adjustment" className="text-white focus:bg-gray-700">Корректировка</SelectItem>
                  <SelectItem value="sale" className="text-white focus:bg-gray-700">Продажа</SelectItem>
                  <SelectItem value="writeoff" className="text-white focus:bg-gray-700">Списание</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Изменение количества</Label>
              <Input
                type="number"
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(e.target.value)}
                placeholder="Например, 12 или -3"
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
              />
              <p className="text-xs text-gray-500">Положительное число увеличивает остаток, отрицательное уменьшает.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Причина</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Например, приёмка поставки"
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Комментарий</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Необязательно"
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="bg-white font-semibold text-gray-900 hover:bg-gray-100">
                {saving ? "Сохранение..." : "Записать движение"}
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
