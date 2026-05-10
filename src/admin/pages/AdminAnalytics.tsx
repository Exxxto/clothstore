import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Layers3,
  Package,
  ShoppingBag,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGetAnalytics, type AnalyticsGenderFilter, type AnalyticsResponse } from "../api";

const GENDER_BUTTONS: Array<{
  value: AnalyticsGenderFilter;
  label: string;
  badgeClass: string;
}> = [
  { value: "all", label: "Все", badgeClass: "bg-gray-900 text-white" },
  { value: "men", label: "Мужское", badgeClass: "bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-white" },
  { value: "women", label: "Женское", badgeClass: "bg-gradient-to-br from-pink-500/20 to-pink-500/5 text-pink-300" },
  { value: "kids", label: "Детское", badgeClass: "bg-gradient-to-br from-green-500/20 to-green-500/5 text-white" },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  new: "#0ea5e9",
  confirmed: "#f59e0b",
  packing: "#8b5cf6",
  shipped: "#3b82f6",
  completed: "#10b981",
  cancelled: "#f43f5e",
};

const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_review: "В работе",
  resolved: "Решена",
  rejected: "Отклонена",
};

const PRODUCT_COLORS = ["#38bdf8", "#a855f7", "#f472b6", "#22c55e", "#f59e0b", "#f43f5e"];

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function TooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  formatter?: (value: number, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-950/95 px-3 py-2 shadow-2xl">
      {label && <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">{label}</p>}
      <div className="space-y-1">
        {payload.map((item) => {
          const value = typeof item.value === "number" ? item.value : 0;
          return (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || "#fff" }} />
              <span className="text-gray-300">{item.name}</span>
              <span className="ml-auto font-medium text-white">
                {formatter ? formatter(value, item.name) : formatNumber(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconTone,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  iconTone: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-5 shadow-sm">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner ${iconTone}`}>
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-4 text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [selectedGender, setSelectedGender] = useState<AnalyticsGenderFilter>("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (gender: AnalyticsGenderFilter) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiGetAnalytics(gender);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки аналитики");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(selectedGender);
  }, [loadAnalytics, selectedGender]);

  const selectedMetrics = data?.selectedMetrics;
  const productGenderCounts = data?.productGenderCounts;
  const complaints = data?.complaints;

  const totalGenderProducts = useMemo(
    () => (productGenderCounts ? productGenderCounts.men + productGenderCounts.women + productGenderCounts.kids : 0),
    [productGenderCounts]
  );

  const genderButtonStats = useMemo(
    () =>
      GENDER_BUTTONS.map((button) => ({
        ...button,
        count:
          button.value === "all"
            ? totalGenderProducts
            : productGenderCounts?.[button.value as Exclude<AnalyticsGenderFilter, "all">] || 0,
      })),
    [productGenderCounts, totalGenderProducts]
  );

  const revenueChartData = useMemo(
    () =>
      (selectedMetrics?.revenueByDay ?? []).map((item) => ({
        ...item,
        label: item.label || formatShortDate(item.day),
      })),
    [selectedMetrics]
  );

  const topTypesData = useMemo(
    () =>
      (selectedMetrics?.topTypes ?? []).map((item) => ({
        ...item,
        value: item.count,
      })),
    [selectedMetrics]
  );

  const orderStatuses = selectedMetrics?.orderStatuses ?? [];
  const recentOrders = selectedMetrics?.recentOrders ?? [];
  const recentComplaints = complaints?.recentComplaints ?? [];
  const complaintStatusCounts = complaints?.statusCounts ?? {};

  const selectedGenderLabel = data?.selectedGenderLabel ?? "Все";

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-gray-800 to-slate-950 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-gray-300">
              <BarChart3 className="h-3.5 w-3.5" />
              Аналитика
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">Показатели магазина по половому срезу</h1>
            <p className="mt-3 text-sm text-gray-300">
              Переключайте пол, чтобы видеть отдельную выручку, заказы, топ товаров и динамику для выбранной аудитории.
              Жалобы остаются общими, потому что у них нет привязки к полу товара.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
            >
              <ShoppingBag className="h-4 w-4" />
              Заказы
            </Link>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gray-900/70 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <Package className="h-4 w-4" />
              Товары
            </Link>
            <button
              type="button"
              onClick={() => void loadAnalytics(selectedGender)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5"
            >
              <TrendingUp className="h-4 w-4" />
              Обновить
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {genderButtonStats.map((button) => {
            const active = selectedGender === button.value;
            return (
              <button
                key={button.value}
                type="button"
                onClick={() => setSelectedGender(button.value)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-white/20 bg-white text-gray-900"
                    : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                }`}
              >
                <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${button.badgeClass}`}>
                  {formatNumber(button.count)}
                </span>
                {button.label}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/60 px-4 py-3 text-sm text-amber-200">{error}</div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label={`Выручка · ${selectedGenderLabel.toLowerCase()}`}
          value={loading || !selectedMetrics ? "—" : formatMoney(selectedMetrics.totalRevenue)}
          icon={CircleDollarSign}
          iconTone="from-emerald-500/20 to-emerald-500/5 text-emerald-300"
        />
        <MetricCard
          label={`Заказы · ${selectedGenderLabel.toLowerCase()}`}
          value={loading || !selectedMetrics ? "—" : formatNumber(selectedMetrics.ordersCount)}
          icon={ShoppingBag}
          iconTone="from-blue-500/20 to-blue-500/5 text-blue-300"
        />
        <MetricCard
          label="Средний чек"
          value={loading || !selectedMetrics ? "—" : formatMoney(selectedMetrics.averageOrderValue)}
          icon={TrendingUp}
          iconTone="from-violet-500/20 to-violet-500/5 text-violet-300"
        />
        <MetricCard
          label="Товары в срезе"
          value={loading || !selectedMetrics ? "—" : formatNumber(selectedMetrics.selectedProductsCount)}
          icon={Layers3}
          iconTone="from-cyan-400 via-cyan-500 to-sky-600 text-white"
        />
        <MetricCard
          label="Открытые жалобы"
          value={loading || !complaints ? "—" : formatNumber(complaints.openComplaints)}
          icon={TriangleAlert}
          iconTone="from-rose-500/20 to-rose-500/5 text-rose-300"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Выручка за 14 дней</h2>
              <p className="mt-1 text-sm text-gray-400">
                {selectedGender === "all"
                  ? "Общая динамика оформленных заказов"
                  : `Динамика заказов только для среза: ${selectedGenderLabel.toLowerCase()}`}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs text-gray-300">
              <CalendarDays className="h-3.5 w-3.5" />
              {loading ? "Загрузка..." : "Последние 14 дней"}
            </div>
          </div>

          <div className="h-80">
            {loading ? (
              <div className="h-full animate-pulse rounded-xl border border-dashed border-gray-700 bg-gray-900/50" />
            ) : revenueChartData.some((item) => item.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <Tooltip content={<TooltipContent formatter={(value) => formatMoney(value)} />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Выручка"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#f59e0b" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/50 text-sm text-gray-500">
                Нет данных по выручке для выбранного пола
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Статусы заказов</h2>
            <p className="mt-1 text-sm text-gray-400">
              {selectedGender === "all"
                ? "Распределение по текущим этапам обработки"
                : `Только заказы, в которых есть товары для среза: ${selectedGenderLabel.toLowerCase()}`}
            </p>
          </div>

          <div className="h-80">
            {loading ? (
              <div className="h-full animate-pulse rounded-xl border border-dashed border-gray-700 bg-gray-900/50" />
            ) : orderStatuses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<TooltipContent formatter={(value) => formatNumber(value)} />} />
                  <Pie data={orderStatuses} dataKey="value" nameKey="label" innerRadius={64} outerRadius={104} paddingAngle={3}>
                    {orderStatuses.map((entry) => (
                      <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status] || "#64748b"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/50 text-sm text-gray-500">
                Заказы для выбранного пола не найдены
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Активные заказы", value: selectedMetrics?.activeOrders ?? 0, tone: "text-blue-300" },
              { label: "Завершено", value: selectedMetrics?.completedOrders ?? 0, tone: "text-emerald-300" },
              { label: "Доля завершения", value: `${(selectedMetrics?.fulfillmentRate ?? 0).toFixed(1)}%`, tone: "text-amber-300" },
              { label: "Новинки", value: selectedMetrics?.newProducts ?? 0, tone: "text-pink-300" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Каталог по типам</h2>
            <p className="mt-1 text-sm text-gray-400">
              {selectedGender === "all"
                ? "Самые крупные группы товаров в ассортименте"
                : `Самые крупные группы товаров для среза: ${selectedGenderLabel.toLowerCase()}`}
            </p>
          </div>

          <div className="h-80">
            {loading ? (
              <div className="h-full animate-pulse rounded-xl border border-dashed border-gray-700 bg-gray-900/50" />
            ) : topTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTypesData} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tick={{ fill: "#d1d5db", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <Tooltip content={<TooltipContent formatter={(value) => formatNumber(value)} />} />
                  <Bar dataKey="value" name="Товары" radius={[0, 12, 12, 0]}>
                    {topTypesData.map((entry, index) => (
                      <Cell key={entry.type} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/50 text-sm text-gray-500">
                Нет данных по товарам для выбранного пола
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Структура каталога и жалоб</h2>
            <p className="mt-1 text-sm text-gray-400">Ключевые разрезы для оперативного контроля</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Товары по полу</p>
                <p className="text-xs text-gray-500">{formatNumber(totalGenderProducts)} позиций</p>
              </div>
              <div className="space-y-3">
                {productGenderCounts ? (
                  ([
                    { key: "men", label: "Мужские", value: productGenderCounts.men },
                    { key: "women", label: "Женские", value: productGenderCounts.women },
                    { key: "kids", label: "Детские", value: productGenderCounts.kids },
                  ] as const).map((item) => {
                    const percent = totalGenderProducts ? (item.value / totalGenderProducts) * 100 : 0;
                    return (
                      <div key={item.key}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-300">{item.label}</span>
                          <span className="text-gray-500">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-800">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percent}%`,
                              backgroundColor:
                                item.key === "men" ? "#a855f7" : item.key === "women" ? "#ec4899" : "#22c55e",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">Нет данных для разбивки по полу</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Статусы жалоб</p>
                <p className="text-xs text-gray-500">{formatNumber(complaints?.totalComplaints ?? 0)} обращений</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Новые", value: complaintStatusCounts.new || 0, status: "new" },
                  { label: "В работе", value: complaintStatusCounts.in_review || 0, status: "in_review" },
                  { label: "Решены", value: complaintStatusCounts.resolved || 0, status: "resolved" },
                  { label: "Отклонены", value: complaintStatusCounts.rejected || 0, status: "rejected" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          item.status === "new"
                            ? "#0ea5e9"
                            : item.status === "in_review"
                              ? "#f59e0b"
                              : item.status === "resolved"
                                ? "#10b981"
                                : "#f43f5e",
                      }}
                    />
                    <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
              <p className="text-sm font-medium text-white">Последние обновления</p>
              <div className="mt-3 space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2">
                    <div>
                      <p className="text-sm text-white">Заказ #{order.id}</p>
                      <p className="text-xs text-gray-500">{formatShortDate(order.created_at)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-200">{formatMoney(order.matched_revenue)}</p>
                  </div>
                ))}
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2">
                    <div>
                      <p className="text-sm text-white">Жалоба #{complaint.id}</p>
                      <p className="text-xs text-gray-500">{formatShortDate(complaint.created_at)}</p>
                    </div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">{COMPLAINT_STATUS_LABELS[complaint.status] ?? complaint.status}</p>
                  </div>
                ))}
                {recentOrders.length === 0 && recentComplaints.length === 0 && (
                  <p className="text-sm text-gray-500">Нет данных для последнего блока</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
