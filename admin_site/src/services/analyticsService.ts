import { pool } from "../db";
import { normalizeGenderInput } from "../lib/productNormalization";

type GenderFilter = "all" | "men" | "women" | "kids";

const GENDER_LABELS: Record<GenderFilter, string> = {
  all: "Все", men: "Мужские", women: "Женские", kids: "Детские",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новый", confirmed: "Подтверждён", packing: "Комплектация",
  shipped: "Отправлен", completed: "Завершён", cancelled: "Отменён",
};

const TYPE_LABELS: Record<string, string> = {
  tshirts: "Футболки", jeans: "Джинсы", jackets: "Куртки", sneakers: "Обувь",
  sweaters: "Свитеры", dresses: "Платья", pants: "Брюки", shirts: "Рубашки",
  hoodies: "Худи", skirts: "Юбки",
};

const ORDER_STATUS_ORDER = ["new", "confirmed", "packing", "shipped", "completed", "cancelled"];

function normalizeGenderFilter(value: unknown): GenderFilter {
  if (typeof value !== "string" || value === "all") return "all";
  return normalizeGenderInput(value) ?? "all";
}

function toDateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatChartLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" })
    .format(new Date(`${value}T00:00:00`));
}

function formatTextDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" })
    .format(new Date(value));
}

export async function getAnalytics(genderQuery: unknown, limitQuery: unknown) {
  const selectedGender = normalizeGenderFilter(genderQuery);
  const limit = Math.min(Number(limitQuery || 500), 500);

  const [productsResult, ordersResult, complaintsResult] = await Promise.all([
    pool.query<{ id: number; gender: string; type: string; is_new: boolean }>(
      "SELECT id, gender, type, is_new FROM products ORDER BY id ASC"
    ),
    pool.query<{
      order_id: number; order_status: string; order_total_amount: number;
      order_created_at: string; item_id: number | null; product_id: number | null;
      product_price: number | null; quantity: number | null;
      product_gender: string | null; product_type: string | null;
    }>(
      `WITH selected_orders AS (
         SELECT id, status, total_amount, created_at
         FROM orders ORDER BY created_at DESC, id DESC LIMIT $1
       )
       SELECT so.id AS order_id, so.status AS order_status,
              so.total_amount AS order_total_amount, so.created_at AS order_created_at,
              oi.id AS item_id, oi.product_id, oi.product_price, oi.quantity,
              p.gender AS product_gender, p.type AS product_type
       FROM selected_orders so
       LEFT JOIN order_items oi ON oi.order_id = so.id
       LEFT JOIN products p ON p.id = oi.product_id
       ORDER BY so.created_at DESC, so.id DESC, oi.id ASC`,
      [limit]
    ),
    pool.query<{ id: number; requester_name: string; status: string; created_at: string }>(
      "SELECT id, requester_name, status, created_at FROM complaints ORDER BY created_at DESC, id DESC LIMIT 500"
    ),
  ]);

  // ── Продукты ──────────────────────────────────────────────────────────────
  const productGenderCounts = { men: 0, women: 0, kids: 0 };
  const selectedTypeCounts = new Map<string, number>();
  let selectedProductsCount = 0;
  let newProducts = 0;

  for (const p of productsResult.rows) {
    const gender = normalizeGenderInput(p.gender);
    if (!gender) continue;
    productGenderCounts[gender] += 1;
    if (selectedGender === "all" || selectedGender === gender) {
      selectedProductsCount += 1;
      if (p.is_new) newProducts += 1;
      selectedTypeCounts.set(p.type, (selectedTypeCounts.get(p.type) || 0) + 1);
    }
  }

  // ── Заказы ────────────────────────────────────────────────────────────────
  type OrderAgg = { id: number; status: string; totalAmount: number; createdAt: string; matchedRevenue: number; hasSelectedGenderItem: boolean };
  const ordersById = new Map<number, OrderAgg>();

  for (const row of ordersResult.rows) {
    if (!ordersById.has(row.order_id)) {
      ordersById.set(row.order_id, {
        id: row.order_id, status: row.order_status, totalAmount: row.order_total_amount,
        createdAt: row.order_created_at, matchedRevenue: 0, hasSelectedGenderItem: false,
      });
    }
  }

  for (const row of ordersResult.rows) {
    const order = ordersById.get(row.order_id);
    if (!order) continue;
    const itemGender = normalizeGenderInput(row.product_gender);
    const qty = row.quantity ?? 0;
    const price = row.product_price ?? 0;

    if (selectedGender === "all") {
      order.matchedRevenue = order.totalAmount;
      order.hasSelectedGenderItem = true;
    } else if (itemGender === selectedGender) {
      order.matchedRevenue += price * qty;
      order.hasSelectedGenderItem = true;
    }
  }

  const selectedOrders = Array.from(ordersById.values()).filter((o) =>
    selectedGender === "all" ? true : o.hasSelectedGenderItem && o.matchedRevenue > 0
  );

  const totalRevenue = selectedOrders.reduce(
    (sum, o) => sum + (selectedGender === "all" ? o.totalAmount : o.matchedRevenue), 0
  );
  const ordersCount = selectedOrders.length;
  const averageOrderValue = ordersCount ? totalRevenue / ordersCount : 0;
  const activeOrders = selectedOrders.filter((o) => ["new", "confirmed", "packing", "shipped"].includes(o.status)).length;
  const completedOrders = selectedOrders.filter((o) => o.status === "completed").length;
  const fulfillmentRate = ordersCount ? (completedOrders / ordersCount) * 100 : 0;

  // ── Revenue by day ────────────────────────────────────────────────────────
  const revenueByDayMap = new Map<string, { day: string; revenue: number; orders: number }>();
  for (const o of selectedOrders) {
    const key = toDateKey(o.createdAt);
    const entry = revenueByDayMap.get(key) || { day: key, revenue: 0, orders: 0 };
    entry.revenue += selectedGender === "all" ? o.totalAmount : o.matchedRevenue;
    entry.orders += 1;
    revenueByDayMap.set(key, entry);
  }

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 13 + i);
    return toDateKey(d);
  });

  const revenueByDay = last14Days.map((day) => {
    const m = revenueByDayMap.get(day);
    return { day, revenue: m?.revenue || 0, orders: m?.orders || 0, label: formatChartLabel(day) };
  });

  const orderStatusCounts = selectedOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatuses = ORDER_STATUS_ORDER
    .filter((s) => orderStatusCounts[s])
    .map((s) => ({ status: s, label: ORDER_STATUS_LABELS[s] ?? s, value: orderStatusCounts[s] }));

  const topTypes = Array.from(selectedTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, count]) => ({ type, label: TYPE_LABELS[type] ?? type, count }));

  const recentOrders = selectedOrders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map((o) => ({
      id: o.id, status: o.status, created_at: o.createdAt,
      matched_revenue: selectedGender === "all" ? o.totalAmount : o.matchedRevenue,
    }));

  // ── Жалобы ────────────────────────────────────────────────────────────────
  const complaintStatusCounts = complaintsResult.rows.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const recentComplaints = complaintsResult.rows
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2)
    .map((c) => ({ id: c.id, requester_name: c.requester_name, status: c.status, created_at: c.created_at, label: formatTextDate(c.created_at) }));

  const openComplaints = complaintsResult.rows.filter((c) => ["new", "in_review"].includes(c.status)).length;

  return {
    selectedGender,
    selectedGenderLabel: GENDER_LABELS[selectedGender],
    productGenderCounts,
    selectedMetrics: {
      selectedProductsCount, newProducts, totalRevenue, ordersCount,
      averageOrderValue, activeOrders, completedOrders, fulfillmentRate,
      revenueByDay, orderStatuses, topTypes, recentOrders,
    },
    complaints: {
      totalComplaints: complaintsResult.rows.length,
      openComplaints,
      statusCounts: complaintStatusCounts,
      recentComplaints,
    },
  };
}
