import { Router, Request, Response } from "express";
import logger from "../lib/logger";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { normalizeGenderInput } from "../lib/productNormalization";

type GenderFilter = "all" | "men" | "women" | "kids";

type ProductRow = {
  id: number;
  gender: string;
  type: string;
  is_new: boolean;
};

type OrderItemRow = {
  order_id: number;
  order_status: string;
  order_total_amount: number;
  order_created_at: string;
  item_id: number | null;
  product_id: number | null;
  product_price: number | null;
  quantity: number | null;
  product_gender: string | null;
  product_type: string | null;
};

type ComplaintRow = {
  id: number;
  requester_name: string;
  status: string;
  created_at: string;
};

const GENDER_LABELS: Record<GenderFilter, string> = {
  all: "Все",
  men: "Мужские",
  women: "Женские",
  kids: "Детские",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  packing: "Комплектация",
  shipped: "Отправлен",
  completed: "Завершён",
  cancelled: "Отменён",
};

const TYPE_LABELS: Record<string, string> = {
  tshirts: "Футболки",
  jeans: "Джинсы",
  jackets: "Куртки",
  sneakers: "Обувь",
  sweaters: "Свитеры",
  dresses: "Платья",
  pants: "Брюки",
  shirts: "Рубашки",
  hoodies: "Худи",
  skirts: "Юбки",
};

const ORDER_STATUS_ORDER = ["new", "confirmed", "packing", "shipped", "completed", "cancelled"];

function normalizeGenderFilter(value: unknown): GenderFilter {
  if (typeof value !== "string") return "all";
  if (value === "all") return "all";

  const normalized = normalizeGenderInput(value);
  return normalized ?? "all";
}

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatChartLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTextDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

const router = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const selectedGender = normalizeGenderFilter(req.query.gender);
  const limit = Math.min(Number(req.query.limit || 500), 500);

  try {
    const [productsResult, ordersResult, complaintsResult] = await Promise.all([
      pool.query<ProductRow>("SELECT id, gender, type, is_new FROM products ORDER BY id ASC"),
      pool.query<OrderItemRow>(
        `WITH selected_orders AS (
           SELECT id, status, total_amount, created_at
           FROM orders
           ORDER BY created_at DESC, id DESC
           LIMIT $1
         )
         SELECT so.id AS order_id,
                so.status AS order_status,
                so.total_amount AS order_total_amount,
                so.created_at AS order_created_at,
                oi.id AS item_id,
                oi.product_id,
                oi.product_price,
                oi.quantity,
                p.gender AS product_gender,
                p.type AS product_type
         FROM selected_orders so
         LEFT JOIN order_items oi ON oi.order_id = so.id
         LEFT JOIN products p ON p.id = oi.product_id
         ORDER BY so.created_at DESC, so.id DESC, oi.id ASC`,
        [limit]
      ),
      pool.query<ComplaintRow>(
        `SELECT id, requester_name, status, created_at
         FROM complaints
         ORDER BY created_at DESC, id DESC
         LIMIT 500`
      ),
    ]);

    const productGenderCounts: Record<"men" | "women" | "kids", number> = {
      men: 0,
      women: 0,
      kids: 0,
    };

    const selectedTypeCounts = new Map<string, number>();
    let selectedProductsCount = 0;
    let newProducts = 0;

    for (const product of productsResult.rows) {
      const gender = normalizeGenderInput(product.gender);
      if (!gender) continue;

      productGenderCounts[gender] += 1;
      if (selectedGender === "all" || selectedGender === gender) {
        selectedProductsCount += 1;
        if (product.is_new) newProducts += 1;
        selectedTypeCounts.set(product.type, (selectedTypeCounts.get(product.type) || 0) + 1);
      }
    }

    const ordersById = new Map<
      number,
      {
        id: number;
        status: string;
        totalAmount: number;
        createdAt: string;
        matchedRevenue: number;
        hasSelectedGenderItem: boolean;
      }
    >();

    for (const row of ordersResult.rows) {
      if (!ordersById.has(row.order_id)) {
        ordersById.set(row.order_id, {
          id: row.order_id,
          status: row.order_status,
          totalAmount: row.order_total_amount,
          createdAt: row.order_created_at,
          matchedRevenue: 0,
          hasSelectedGenderItem: false,
        });
      }
    }

    for (const row of ordersResult.rows) {
      const order = ordersById.get(row.order_id);
      if (!order) continue;

      const itemGender = normalizeGenderInput(row.product_gender);
      const quantity = row.quantity ?? 0;
      const price = row.product_price ?? 0;

      if (selectedGender === "all") {
        order.matchedRevenue = order.totalAmount;
        order.hasSelectedGenderItem = true;
        continue;
      }

      if (itemGender === selectedGender) {
        order.matchedRevenue += price * quantity;
        order.hasSelectedGenderItem = true;
      }
    }

    const selectedOrders = Array.from(ordersById.values()).filter((order) =>
      selectedGender === "all" ? true : order.hasSelectedGenderItem && order.matchedRevenue > 0
    );

    const totalRevenue = selectedGender === "all"
      ? selectedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      : selectedOrders.reduce((sum, order) => sum + order.matchedRevenue, 0);

    const ordersCount = selectedOrders.length;
    const averageOrderValue = ordersCount ? totalRevenue / ordersCount : 0;
    const activeOrders = selectedOrders.filter((order) => ["new", "confirmed", "packing", "shipped"].includes(order.status)).length;
    const completedOrders = selectedOrders.filter((order) => order.status === "completed").length;
    const fulfillmentRate = ordersCount ? (completedOrders / ordersCount) * 100 : 0;

    const revenueByDayMap = new Map<string, { day: string; revenue: number; orders: number }>();
    for (const order of selectedOrders) {
      const dayKey = toDateKey(order.createdAt);
      const existing = revenueByDayMap.get(dayKey) || {
        day: dayKey,
        revenue: 0,
        orders: 0,
      };

      existing.revenue += selectedGender === "all" ? order.totalAmount : order.matchedRevenue;
      existing.orders += 1;
      revenueByDayMap.set(dayKey, existing);
    }

    const last14Days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - 13 + index);
      return toDateKey(date);
    });

    const revenueByDay = last14Days.map((day) => {
      const match = revenueByDayMap.get(day);
      return {
        day,
        revenue: match?.revenue || 0,
        orders: match?.orders || 0,
        label: formatChartLabel(day),
      };
    });

    const orderStatusCounts = selectedOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const orderStatuses = ORDER_STATUS_ORDER
      .filter((status) => orderStatusCounts[status])
      .map((status) => ({
        status,
        label: ORDER_STATUS_LABELS[status] ?? status,
        value: orderStatusCounts[status],
      }));

    const topTypes = Array.from(selectedTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([type, count]) => ({ type, label: TYPE_LABELS[type] ?? type, count }));

    const recentOrders = selectedOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((order) => ({
        id: order.id,
        status: order.status,
        created_at: order.createdAt,
        matched_revenue: selectedGender === "all" ? order.totalAmount : order.matchedRevenue,
      }));

    const complaintStatusCounts = complaintsResult.rows.reduce<Record<string, number>>((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {});

    const recentComplaints = complaintsResult.rows
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map((complaint) => ({
        id: complaint.id,
        requester_name: complaint.requester_name,
        status: complaint.status,
        created_at: complaint.created_at,
        label: formatTextDate(complaint.created_at),
      }));

    const openComplaints = complaintsResult.rows.filter((complaint) => ["new", "in_review"].includes(complaint.status)).length;

    res.json({
      selectedGender,
      selectedGenderLabel: GENDER_LABELS[selectedGender],
      productGenderCounts,
      selectedMetrics: {
        selectedProductsCount,
        newProducts,
        totalRevenue,
        ordersCount,
        averageOrderValue,
        activeOrders,
        completedOrders,
        fulfillmentRate,
        revenueByDay,
        orderStatuses,
        topTypes,
        recentOrders,
      },
      complaints: {
        totalComplaints: complaintsResult.rows.length,
        openComplaints,
        statusCounts: complaintStatusCounts,
        recentComplaints,
      },
    });
  } catch (err) {
    logger.error("Route error", { error: err });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;
