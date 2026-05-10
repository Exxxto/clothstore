import { useEffect, useMemo, useSyncExternalStore } from "react";

import { products, type Product } from "@/data/products";
import {
  apiAddCartItem,
  apiGetCart,
  apiRemoveCartItem,
  apiUpdateCartItem,
  type StoreCart,
  type StoreCartItem,
} from "@/lib/storeApi";

const cartStorageKey = "clothstore.cart.snapshot.v1";
const productById = new Map(products.map((product) => [product.id, product] as const));

type CartSnapshot = StoreCart;

const emptyCartSnapshot: CartSnapshot = {
  id: null,
  status: "active",
  currency: "RUB",
  promo_code: null,
  items: [],
  item_count: 0,
  subtotal: 0,
};

let cachedCartSnapshot: CartSnapshot | null = null;
let syncStarted = false;
let syncInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function readCartSnapshotFromStorage() {
  if (typeof window === "undefined") {
    return emptyCartSnapshot;
  }

  try {
    const raw = window.localStorage.getItem(cartStorageKey);
    if (!raw) {
      return emptyCartSnapshot;
    }
    const parsed = JSON.parse(raw) as Partial<CartSnapshot>;
    return {
      ...emptyCartSnapshot,
      ...parsed,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      item_count: Number(parsed.item_count) || 0,
      subtotal: Number(parsed.subtotal) || 0,
    };
  } catch {
    return emptyCartSnapshot;
  }
}

function persistCartSnapshot(snapshot: CartSnapshot) {
  cachedCartSnapshot = snapshot;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(snapshot));
  }
}

function getCartSnapshot() {
  if (cachedCartSnapshot === null) {
    cachedCartSnapshot = readCartSnapshotFromStorage();
  }
  return cachedCartSnapshot;
}

function notifySubscribers() {
  for (const listener of listeners) {
    listener();
  }
}

function setCartSnapshot(snapshot: CartSnapshot) {
  persistCartSnapshot(snapshot);
  notifySubscribers();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function syncCartFromServer() {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = apiGetCart()
    .then((snapshot) => {
      setCartSnapshot(snapshot);
    })
    .catch(() => {
      // keep last cached snapshot for graceful degradation
    })
    .finally(() => {
      syncInFlight = null;
    });

  return syncInFlight;
}

function ensureCartSyncStarted() {
  if (syncStarted) {
    return;
  }
  syncStarted = true;
  void syncCartFromServer();
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, getCartSnapshot, () => emptyCartSnapshot);

  useEffect(() => {
    ensureCartSyncStarted();
  }, []);

  const cartProducts = useMemo(() => {
    return cart.items.map((item) => {
      const product = item.product_id ? productById.get(item.product_id) : undefined;
      return {
        ...item,
        product,
      };
    });
  }, [cart.items]);

  const addToCart = async (data: {
    productId: number;
    quantity?: number;
    size?: string | null;
    productVariantId?: number | null;
  }) => {
    const snapshot = await apiAddCartItem({
      product_id: data.productId,
      quantity: data.quantity,
      size: data.size,
      product_variant_id: data.productVariantId,
    });
    setCartSnapshot(snapshot);
    return snapshot;
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const snapshot = await apiUpdateCartItem(itemId, quantity);
    setCartSnapshot(snapshot);
    return snapshot;
  };

  const removeItem = async (itemId: number) => {
    const snapshot = await apiRemoveCartItem(itemId);
    setCartSnapshot(snapshot);
    return snapshot;
  };

  const refreshCart = async () => {
    await syncCartFromServer();
  };

  return {
    cart,
    cartItems: cartProducts,
    subtotal: cart.subtotal,
    totalItems: cart.item_count,
    addToCart,
    updateQuantity,
    removeItem,
    refreshCart,
  };
}

export type CartProductView = StoreCartItem & {
  product?: Product;
};
