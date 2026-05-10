const BASE_URL = "/api";

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Ошибка сервера" }));
    throw new Error(err.error || "Ошибка сервера");
  }
  return res.json();
}

// Auth
export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<{ token: string; username: string; full_name: string; role: string }>(res);
}

// Products
export interface DBProduct {
  id: number;
  name: string;
  type: string;
  gender: string;
  price: number;
  old_price: number | null;
  image_url: string | null;
  season: string;
  category_id: number | null;
  is_new: boolean;
  sizes: string[];
  description: string;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<DBProduct, "id" | "created_at" | "updated_at">;

export async function apiGetProducts(filters?: {
  gender?: string;
  type?: string;
  season?: string;
  search?: string;
}): Promise<DBProduct[]> {
  const params = new URLSearchParams();
  if (filters?.gender) params.set("gender", filters.gender);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.season) params.set("season", filters.season);
  if (filters?.search) params.set("search", filters.search);

  const res = await fetch(`${BASE_URL}/products?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<DBProduct[]>(res);
}

export type AnalyticsGenderFilter = "all" | "men" | "women" | "kids";

export interface AnalyticsResponse {
  selectedGender: AnalyticsGenderFilter;
  selectedGenderLabel: string;
  productGenderCounts: Record<"men" | "women" | "kids", number>;
  selectedMetrics: {
    selectedProductsCount: number;
    newProducts: number;
    totalRevenue: number;
    ordersCount: number;
    averageOrderValue: number;
    activeOrders: number;
    completedOrders: number;
    fulfillmentRate: number;
    revenueByDay: Array<{ day: string; label: string; revenue: number; orders: number }>;
    orderStatuses: Array<{ status: string; label: string; value: number }>;
    topTypes: Array<{ type: string; label: string; count: number }>;
    recentOrders: Array<{ id: number; status: string; created_at: string; matched_revenue: number }>;
  };
  complaints: {
    totalComplaints: number;
    openComplaints: number;
    statusCounts: Record<string, number>;
    recentComplaints: Array<{ id: number; requester_name: string; status: string; created_at: string; label: string }>;
  };
}

export async function apiGetAnalytics(gender?: AnalyticsGenderFilter): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (gender) params.set("gender", gender);

  const res = await fetch(`${BASE_URL}/analytics?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<AnalyticsResponse>(res);
}

export async function apiGetProduct(id: number): Promise<DBProduct> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<DBProduct>(res);
}

export async function apiCreateProduct(data: ProductInput): Promise<DBProduct> {
  const res = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<DBProduct>(res);
}

export async function apiUpdateProduct(id: number, data: ProductInput): Promise<DBProduct> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<DBProduct>(res);
}

export async function apiDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

export async function apiUploadProductImage(file: File, gender?: string): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);
  const params = gender ? `?gender=${encodeURIComponent(gender)}` : "";
  const res = await fetch(`${BASE_URL}/upload/product-image${params}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse<{ url: string }>(res);
}

// Categories
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export async function apiGetCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/categories`, {
    headers: authHeaders(),
  });
  return handleResponse<Category[]>(res);
}

export async function apiCreateCategory(data: {
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}): Promise<Category> {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Category>(res);
}

export async function apiUpdateCategory(id: number, data: {
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}): Promise<Category> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Category>(res);
}

export async function apiDeleteCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Collections
export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export async function apiGetCollections(): Promise<Collection[]> {
  const res = await fetch(`${BASE_URL}/collections`, {
    headers: authHeaders(),
  });
  return handleResponse<Collection[]>(res);
}

export async function apiCreateCollection(data: {
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}): Promise<Collection> {
  const res = await fetch(`${BASE_URL}/collections`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Collection>(res);
}

export async function apiUpdateCollection(id: number, data: {
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}): Promise<Collection> {
  const res = await fetch(`${BASE_URL}/collections/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Collection>(res);
}

export async function apiDeleteCollection(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/collections/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Warehouses
export interface Warehouse {
  id: number;
  name: string;
  code: string;
  city: string | null;
  address: string | null;
  is_active: boolean;
  balances_count?: number;
  total_items?: number;
  created_at: string;
  updated_at: string;
}

export async function apiGetWarehouses(): Promise<Warehouse[]> {
  const res = await fetch(`${BASE_URL}/warehouses`, {
    headers: authHeaders(),
  });
  return handleResponse<Warehouse[]>(res);
}

export async function apiCreateWarehouse(data: {
  name: string;
  code?: string;
  city?: string | null;
  address?: string | null;
  is_active?: boolean;
}): Promise<Warehouse> {
  const res = await fetch(`${BASE_URL}/warehouses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Warehouse>(res);
}

export async function apiUpdateWarehouse(id: number, data: {
  name: string;
  code?: string;
  city?: string | null;
  address?: string | null;
  is_active?: boolean;
}): Promise<Warehouse> {
  const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Warehouse>(res);
}

export async function apiDeleteWarehouse(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Promo codes
export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  redemptions_count?: number;
  created_at: string;
  updated_at: string;
}

export async function apiGetPromoCodes(): Promise<PromoCode[]> {
  const res = await fetch(`${BASE_URL}/promo-codes`, {
    headers: authHeaders(),
  });
  return handleResponse<PromoCode[]>(res);
}

export async function apiCreatePromoCode(data: {
  code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  is_active?: boolean;
}): Promise<PromoCode> {
  const res = await fetch(`${BASE_URL}/promo-codes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<PromoCode>(res);
}

export async function apiUpdatePromoCode(id: number, data: {
  code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  is_active?: boolean;
}): Promise<PromoCode> {
  const res = await fetch(`${BASE_URL}/promo-codes/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<PromoCode>(res);
}

export async function apiDeletePromoCode(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/promo-codes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Checkout methods
export interface AdminShippingMethod {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPaymentMethod {
  id: number;
  code: string;
  name: string;
  description: string | null;
  requires_card: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ShippingMethodInput = {
  code: string;
  name: string;
  description?: string | null;
  price?: number;
  sort_order?: number;
  is_active?: boolean;
};

export type PaymentMethodInput = {
  code: string;
  name: string;
  description?: string | null;
  requires_card?: boolean;
  sort_order?: number;
  is_active?: boolean;
};

export async function apiGetCheckoutMethods(): Promise<{
  shipping_methods: AdminShippingMethod[];
  payment_methods: AdminPaymentMethod[];
}> {
  const res = await fetch(`${BASE_URL}/checkout-methods`, {
    headers: authHeaders(),
  });
  return handleResponse<{
    shipping_methods: AdminShippingMethod[];
    payment_methods: AdminPaymentMethod[];
  }>(res);
}

export async function apiCreateShippingMethod(data: ShippingMethodInput): Promise<AdminShippingMethod> {
  const res = await fetch(`${BASE_URL}/checkout-methods/shipping`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AdminShippingMethod>(res);
}

export async function apiUpdateShippingMethod(id: number, data: ShippingMethodInput): Promise<AdminShippingMethod> {
  const res = await fetch(`${BASE_URL}/checkout-methods/shipping/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AdminShippingMethod>(res);
}

export async function apiDeleteShippingMethod(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/checkout-methods/shipping/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

export async function apiCreatePaymentMethod(data: PaymentMethodInput): Promise<AdminPaymentMethod> {
  const res = await fetch(`${BASE_URL}/checkout-methods/payment`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AdminPaymentMethod>(res);
}

export async function apiUpdatePaymentMethod(id: number, data: PaymentMethodInput): Promise<AdminPaymentMethod> {
  const res = await fetch(`${BASE_URL}/checkout-methods/payment/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AdminPaymentMethod>(res);
}

export async function apiDeletePaymentMethod(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/checkout-methods/payment/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Product variants
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  variant_name: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  price: number;
  old_price: number | null;
  cost_price: number | null;
  stock_tracking: boolean;
  is_active: boolean;
  auto_generated: boolean;
  attributes: Record<string, unknown>;
  product_name?: string;
  product_gender?: string;
  product_type?: string;
  total_stock?: number;
  total_reserved?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantBalance {
  id: number;
  warehouse_id: number;
  product_variant_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_point: number;
  updated_at: string;
  warehouse_name: string;
  warehouse_code: string;
}

export interface ProductVariantDetails extends ProductVariant {
  balances: ProductVariantBalance[];
}

export async function apiGetProductVariants(filters?: {
  product_id?: number;
  search?: string;
  active?: "true" | "false" | "all";
}): Promise<ProductVariant[]> {
  const params = new URLSearchParams();
  if (filters?.product_id) params.set("product_id", String(filters.product_id));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.active) params.set("active", filters.active);

  const res = await fetch(`${BASE_URL}/product-variants?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<ProductVariant[]>(res);
}

export async function apiGetProductVariant(id: number): Promise<ProductVariantDetails> {
  const res = await fetch(`${BASE_URL}/product-variants/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<ProductVariantDetails>(res);
}

export async function apiCreateProductVariant(data: {
  product_id: number;
  variant_name?: string;
  size?: string | null;
  color?: string | null;
  barcode?: string | null;
  sku?: string;
  price: number;
  old_price?: number | null;
  cost_price?: number | null;
  stock_tracking?: boolean;
  is_active?: boolean;
  attributes?: Record<string, unknown>;
}): Promise<ProductVariant> {
  const res = await fetch(`${BASE_URL}/product-variants`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<ProductVariant>(res);
}

export async function apiUpdateProductVariant(id: number, data: {
  variant_name: string;
  size?: string | null;
  color?: string | null;
  barcode?: string | null;
  sku?: string;
  price: number;
  old_price?: number | null;
  cost_price?: number | null;
  stock_tracking?: boolean;
  is_active?: boolean;
  attributes?: Record<string, unknown>;
}): Promise<ProductVariant> {
  const res = await fetch(`${BASE_URL}/product-variants/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<ProductVariant>(res);
}

export async function apiDeactivateProductVariant(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/product-variants/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Inventory
export interface InventoryBalance {
  id: number;
  warehouse_id: number;
  product_variant_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_point: number;
  updated_at: string;
  warehouse_name: string;
  warehouse_code: string;
  sku: string;
  variant_name: string;
  size: string | null;
  color: string | null;
  price: number;
  variant_is_active: boolean;
  product_id: number;
  product_name: string;
  product_gender: string;
  product_type: string;
}

export interface StockMovement {
  id: number;
  warehouse_id: number;
  product_variant_id: number;
  movement_type: string;
  quantity_delta: number;
  quantity_after: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
  warehouse_name: string;
  sku: string;
  variant_name: string;
  product_name: string;
  admin_username: string | null;
}

export async function apiGetInventoryBalances(filters?: {
  warehouse_id?: number;
  search?: string;
  low_stock?: boolean;
}): Promise<InventoryBalance[]> {
  const params = new URLSearchParams();
  if (filters?.warehouse_id) params.set("warehouse_id", String(filters.warehouse_id));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.low_stock) params.set("low_stock", "true");

  const res = await fetch(`${BASE_URL}/inventory?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<InventoryBalance[]>(res);
}

export async function apiGetStockMovements(limit = 100): Promise<StockMovement[]> {
  const res = await fetch(`${BASE_URL}/inventory/movements?limit=${limit}`, {
    headers: authHeaders(),
  });
  return handleResponse<StockMovement[]>(res);
}

export async function apiCreateStockMovement(data: {
  warehouse_id: number;
  product_variant_id: number;
  quantity_delta: number;
  movement_type: string;
  reason?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  notes?: string | null;
}) {
  const res = await fetch(`${BASE_URL}/inventory/movements`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{
    id: number;
    warehouse_id: number;
    product_variant_id: number;
    quantity_on_hand: number;
    quantity_reserved: number;
    reorder_point: number;
    updated_at: string;
  }>(res);
}

// Complaints
export interface Complaint {
  id: number;
  requester_name: string;
  email: string;
  phone: string | null;
  order_number: string | null;
  category: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function apiGetComplaints(filters?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<Complaint[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", String(filters.limit));

  const res = await fetch(`${BASE_URL}/complaints?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<Complaint[]>(res);
}

export async function apiGetComplaint(id: number): Promise<Complaint> {
  const res = await fetch(`${BASE_URL}/complaints/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<Complaint>(res);
}

export async function apiUpdateComplaintStatus(
  id: number,
  status: string
): Promise<{ id: number; status: string; updated_at: string }> {
  const res = await fetch(`${BASE_URL}/complaints/${id}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<{ id: number; status: string; updated_at: string }>(res);
}

// ─── Admins ───────────────────────────────────────────────────────────────────

export interface Admin {
  id: number;
  full_name: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export async function apiGetAdmins(): Promise<Admin[]> {
  const res = await fetch(`${BASE_URL}/admins`, { headers: authHeaders() });
  return handleResponse<Admin[]>(res);
}

export async function apiCreateAdmin(data: {
  full_name: string;
  username: string;
  password: string;
  role?: string;
}): Promise<Admin> {
  const res = await fetch(`${BASE_URL}/admins`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Admin>(res);
}

export async function apiUpdateAdmin(id: number, data: {
  full_name: string;
  username: string;
  role: string;
  is_active: boolean;
}): Promise<Admin> {
  const res = await fetch(`${BASE_URL}/admins/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Admin>(res);
}

export async function apiChangeAdminPassword(id: number, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/admins/${id}/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ password }),
  });
  return handleResponse<void>(res);
}

export async function apiDeleteAdmin(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/admins/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

// Orders
export interface OrderSummary {
  id: number;
  user_id: number | null;
  status: string;
  total_amount: number;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  delivery_address: string | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  delivery_method: string | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  comment: string | null;
  is_test: boolean;
  test_run_id: string | null;
  source: string | null;
  customer_display_name: string | null;
  user_email: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  quantity: number;
  size: string | null;
  created_at: string;
}

export interface OrderDetails extends OrderSummary {
  items: OrderItem[];
}

export async function apiGetOrders(filters?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<OrderSummary[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.limit) params.set("limit", String(filters.limit));

  const res = await fetch(`${BASE_URL}/orders?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<OrderSummary[]>(res);
}

export async function apiGetOrder(id: number): Promise<OrderDetails> {
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<OrderDetails>(res);
}

export async function apiUpdateOrderStatus(id: number, status: string): Promise<{ id: number; status: string; updated_at: string }> {
  const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<{ id: number; status: string; updated_at: string }>(res);
}

export async function apiUpdateOrderPayment(
  id: number,
  payload: { payment_status: string; payment_provider?: string | null; payment_reference?: string | null },
): Promise<{ id: number; payment_status: string; payment_provider: string | null; payment_reference: string | null; paid_at: string | null; updated_at: string }> {
  const res = await fetch(`${BASE_URL}/orders/${id}/payment`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function apiUpdateOrderFulfillment(
  id: number,
  payload: { carrier?: string | null; tracking_number?: string | null; shipped_at?: string | null },
): Promise<{ id: number; carrier: string | null; tracking_number: string | null; shipped_at: string | null; updated_at: string }> {
  const res = await fetch(`${BASE_URL}/orders/${id}/fulfillment`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
