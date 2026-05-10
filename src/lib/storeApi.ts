import { getStoreSessionId } from "./storeSession";

type WishlistRow = {
  id: number;
  product_id: number;
  created_at: string;
};

export type StoreCartItem = {
  id: number;
  cart_id: number;
  product_id: number | null;
  product_variant_id: number | null;
  product_name: string;
  image_url: string | null;
  size: string | null;
  unit_price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_gender?: string | null;
  product_type?: string | null;
  variant_sku?: string | null;
};

export type StoreCart = {
  id: number | null;
  status: string;
  currency: string;
  promo_code: string | null;
  items: StoreCartItem[];
  item_count: number;
  subtotal: number;
};

export type StoreShippingMethod = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number;
};

export type StorePaymentMethod = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  requires_card: boolean;
  sort_order: number;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Ошибка сервера" }));
    throw new Error(payload.error || "Ошибка сервера");
  }
  return response.json();
}

export async function apiGetWishlist() {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/wishlist?session_id=${encodeURIComponent(sessionId)}`);
  return handleResponse<WishlistRow[]>(response);
}

export async function apiAddWishlistItem(productId: number) {
  const response = await fetch("/api/store/wishlist/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      product_id: productId,
    }),
  });
  return handleResponse<WishlistRow[]>(response);
}

export async function apiRemoveWishlistItem(productId: number) {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/wishlist/items/${productId}?session_id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
  return handleResponse<WishlistRow[]>(response);
}

export async function apiGetCart() {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/cart?session_id=${encodeURIComponent(sessionId)}`);
  return handleResponse<StoreCart>(response);
}

export async function apiAddCartItem(data: {
  product_id: number;
  product_variant_id?: number | null;
  quantity?: number;
  size?: string | null;
}) {
  const response = await fetch("/api/store/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      ...data,
    }),
  });
  return handleResponse<StoreCart>(response);
}

export async function apiUpdateCartItem(itemId: number, quantity: number) {
  const response = await fetch(`/api/store/cart/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      quantity,
    }),
  });
  return handleResponse<StoreCart>(response);
}

export async function apiRemoveCartItem(itemId: number) {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/cart/items/${itemId}?session_id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
  return handleResponse<StoreCart>(response);
}

export async function apiValidatePromoCode(code: string, subtotal: number) {
  const response = await fetch("/api/store/promo-codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  return handleResponse<{
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
  }>(response);
}

export async function apiGetCheckoutOptions() {
  const response = await fetch("/api/store/checkout/options");
  return handleResponse<{
    shipping_methods: StoreShippingMethod[];
    payment_methods: StorePaymentMethod[];
  }>(response);
}

export async function apiCheckout(data: {
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone?: string;
  };
  shipping_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code?: string;
    country: string;
  };
  shipping_address_id?: number | null;
  save_shipping_address?: boolean;
  billing_address?: {
    email?: string;
    phone?: string;
    address_line1: string;
    address_line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
  billing_address_id?: number | null;
  save_billing_address?: boolean;
  shipping_option: string;
  payment_method: string;
  promo_code?: string | null;
  is_test?: boolean;
  test_run_id?: string | null;
  source?: string;
}) {
  const response = await fetch("/api/store/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      ...data,
    }),
  });
  return handleResponse<{
    order_id: number;
    subtotal: number;
    shipping_price: number;
    discount_amount: number;
    total_amount: number;
    shipping_method: string;
    payment_method: string;
    payment_status: string;
    payment_provider: string;
    payment_reference: string | null;
    status: string;
    is_test: boolean;
    test_run_id: string | null;
  }>(response);
}

export type StoreProfile = {
  id: number | null;
  session_id: string;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreOrderStatus = "new" | "confirmed" | "packing" | "shipped" | "completed" | "cancelled";

export type StoreAddress = {
  id: number;
  label: string | null;
  customer_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  address_line1: string;
  address_line2: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreAddressPayload = {
  label?: string | null;
  customer_name: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  postal_code?: string | null;
  address_line1: string;
  address_line2?: string | null;
  is_default?: boolean;
};

export type StoreOrderSummary = {
  id: number;
  status: StoreOrderStatus;
  total_amount: number;
  delivery_method: string | null;
  payment_method: string | null;
  payment_status?: string | null;
  payment_provider?: string | null;
  delivery_address: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  is_test?: boolean;
  test_run_id?: string | null;
  created_at: string;
  updated_at: string;
};

export async function apiGetAccountProfile() {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/account/profile?session_id=${encodeURIComponent(sessionId)}`);
  return handleResponse<{ profile: StoreProfile; addresses: StoreAddress[] }>(response);
}

export async function apiUpdateAccountProfile(data: {
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
}) {
  const response = await fetch("/api/store/account/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      ...data,
    }),
  });
  return handleResponse<StoreProfile>(response);
}

export async function apiGetAccountOrders() {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/account/orders?session_id=${encodeURIComponent(sessionId)}`);
  return handleResponse<StoreOrderSummary[]>(response);
}

export async function apiGetAccountAddresses() {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/account/addresses?session_id=${encodeURIComponent(sessionId)}`);
  return handleResponse<StoreAddress[]>(response);
}

export async function apiCreateAccountAddress(data: StoreAddressPayload) {
  const response = await fetch("/api/store/account/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      ...data,
    }),
  });
  return handleResponse<StoreAddress[]>(response);
}

export async function apiUpdateAccountAddress(addressId: number, data: StoreAddressPayload) {
  const response = await fetch(`/api/store/account/addresses/${addressId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
      ...data,
    }),
  });
  return handleResponse<StoreAddress[]>(response);
}

export async function apiSetDefaultAccountAddress(addressId: number) {
  const response = await fetch(`/api/store/account/addresses/${addressId}/default`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getStoreSessionId(),
    }),
  });
  return handleResponse<StoreAddress[]>(response);
}

export async function apiDeleteAccountAddress(addressId: number) {
  const sessionId = getStoreSessionId();
  const response = await fetch(`/api/store/account/addresses/${addressId}?session_id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
  return handleResponse<StoreAddress[]>(response);
}
