import { useCallback, useEffect, useState, type ComponentType } from "react";
import {
  RefreshCw,
  Search,
  TriangleAlert,
  Clock3,
  CheckCircle2,
  CircleX,
  User,
  Mail,
  Phone,
  ReceiptText,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { apiGetComplaint, apiGetComplaints, apiUpdateComplaintStatus, type Complaint } from "../api";

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новая" },
  { value: "in_review", label: "На рассмотрении" },
  { value: "resolved", label: "Решена" },
  { value: "rejected", label: "Отклонена" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_review: "На рассмотрении",
  resolved: "Решена",
  rejected: "Отклонена",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  in_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const STATUS_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  new: TriangleAlert,
  in_review: Clock3,
  resolved: CheckCircle2,
  rejected: CircleX,
};

const DETAIL_FIELDS = [
  { key: "requester_name", label: "Имя", icon: User },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Телефон", icon: Phone },
  { key: "order_number", label: "Номер заказа", icon: ReceiptText },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusDraft, setStatusDraft] = useState("new");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetComplaints({
        status: statusFilter,
        search: search.trim() || undefined,
        limit: 200,
      });
      setComplaints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки жалоб");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadComplaints();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadComplaints]);

  const openDetails = async (complaintId: number) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setError("");
    try {
      const data = await apiGetComplaint(complaintId);
      setSelectedComplaint(data);
      setStatusDraft(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки жалобы");
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveStatus = async () => {
    if (!selectedComplaint) return;

    setSavingStatus(true);
    setError("");
    try {
      const result = await apiUpdateComplaintStatus(selectedComplaint.id, statusDraft);
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === selectedComplaint.id
            ? { ...complaint, status: result.status, updated_at: result.updated_at }
            : complaint
        )
      );
      setSelectedComplaint((prev) =>
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

  const openCount = complaints.filter((item) => item.status === "new" || item.status === "in_review").length;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs uppercase tracking-[0.18em] mb-3">
            <TriangleAlert className="w-3.5 h-3.5" />
            Жалобы
          </div>
          <h1 className="text-2xl font-bold text-white">Жалобы покупателей</h1>
          <p className="text-gray-400 mt-1 text-sm">Обращения с сайта и их текущий статус</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={loadComplaints}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-gray-400 text-sm">Всего жалоб</p>
          <p className="text-3xl font-bold text-white mt-2">{loading ? "—" : complaints.length}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-gray-400 text-sm">Открытые</p>
          <p className="text-3xl font-bold text-white mt-2">{loading ? "—" : openCount}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-gray-400 text-sm">Закрытые</p>
          <p className="text-3xl font-bold text-white mt-2">{loading ? "—" : complaints.length - openCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, заказу или тексту"
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
            <h2 className="text-white font-semibold">Список жалоб</h2>
            <p className="text-gray-400 text-sm">{loading ? "Загрузка..." : `${complaints.length} жалоб`}</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <TriangleAlert className="w-4 h-4" />
            {statusFilter === "all" ? "Все статусы" : STATUS_LABELS[statusFilter] || statusFilter}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Жалоба</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Клиент</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Заказ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Категория</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Статус</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    {[...Array(6)].map((__, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4">
                        <div className="h-4 rounded bg-gray-700 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-gray-500">
                    Жалобы не найдены
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => {
                  const StatusIcon = STATUS_ICONS[complaint.status] || TriangleAlert;
                  return (
                    <tr key={complaint.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">#{complaint.id}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{formatDate(complaint.created_at)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">{complaint.requester_name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{complaint.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {complaint.order_number || "Без номера"}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {complaint.category}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[complaint.status] || STATUS_CLASSES.new}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {STATUS_LABELS[complaint.status] || complaint.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(complaint.id)}
                            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            Открыть
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
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Жалоба #{selectedComplaint?.id || "..."}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Детали обращения и управление его статусом
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-3">
              <div className="h-5 bg-gray-800 rounded animate-pulse" />
              <div className="h-24 bg-gray-800 rounded animate-pulse" />
            </div>
          ) : selectedComplaint ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DETAIL_FIELDS.map((field) => {
                  const Icon = field.icon;
                  const value = selectedComplaint[field.key];
                  return (
                    <div key={field.key} className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-[0.18em]">
                        <Icon className="w-3.5 h-3.5" />
                        {field.label}
                      </div>
                      <p className="mt-2 text-white text-sm break-words">{value || "Не указано"}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                  <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">Категория</p>
                  <p className="mt-2 text-white text-sm">{selectedComplaint.category}</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                  <p className="text-gray-400 text-xs uppercase tracking-[0.18em]">Дата</p>
                  <p className="mt-2 text-white text-sm">{formatDate(selectedComplaint.created_at)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                <p className="text-gray-400 text-xs uppercase tracking-[0.18em] mb-3">Текст жалобы</p>
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selectedComplaint.message}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-2">Статус</label>
                  <Select value={statusDraft} onValueChange={setStatusDraft}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {STATUS_OPTIONS.filter((item) => item.value !== "all").map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={saveStatus}
                  disabled={savingStatus}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  {savingStatus ? "Сохранение..." : "Сохранить статус"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
