import { useEffect, useMemo, useSyncExternalStore } from "react";

import { products, type Product } from "@/data/products";
import { apiAddWishlistItem, apiGetWishlist, apiRemoveWishlistItem } from "@/lib/storeApi";

const favoritesStorageKey = "clothstore.favorites.v1";
const productById = new Map(products.map((product) => [product.id, product] as const));

let cachedFavoriteIds: number[] | null = null;
const listeners = new Set<() => void>();
let syncStarted = false;
let syncInFlight: Promise<void> | null = null;

function sanitizeFavoriteIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as number[];
  }

  const seen = new Set<number>();
  const result: number[] = [];

  for (const rawValue of value) {
    const parsed = typeof rawValue === "number" ? rawValue : Number(rawValue);

    if (!Number.isFinite(parsed)) {
      continue;
    }

    const id = Math.trunc(parsed);

    if (!productById.has(id) || seen.has(id)) {
      continue;
    }

    seen.add(id);
    result.push(id);
  }

  return result;
}

function readFavoriteIdsFromStorage() {
  if (typeof window === "undefined") {
    return [] as number[];
  }

  try {
    const raw = window.localStorage.getItem(favoritesStorageKey);

    if (!raw) {
      return [] as number[];
    }

    return sanitizeFavoriteIds(JSON.parse(raw));
  } catch {
    return [] as number[];
  }
}

function getFavoriteIdsSnapshot() {
  if (cachedFavoriteIds === null) {
    cachedFavoriteIds = readFavoriteIdsFromStorage();
  }

  return cachedFavoriteIds;
}

function persistFavoriteIds(nextIds: number[]) {
  const sanitized = sanitizeFavoriteIds(nextIds);
  cachedFavoriteIds = sanitized;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify(sanitized));
  }
}

function notifySubscribers() {
  for (const listener of listeners) {
    listener();
  }
}

function setFavoriteIds(nextIds: number[]) {
  persistFavoriteIds(nextIds);
  notifySubscribers();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

async function syncFavoritesFromServer() {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = apiGetWishlist()
    .then((rows) => {
      setFavoriteIds(rows.map((row) => row.product_id));
    })
    .catch(() => {
      // Keep local cache if API is unavailable.
    })
    .finally(() => {
      syncInFlight = null;
    });

  return syncInFlight;
}

function ensureSyncStarted() {
  if (syncStarted) {
    return;
  }
  syncStarted = true;
  void syncFavoritesFromServer();
}

export function useFavorites() {
  const favoriteIds = useSyncExternalStore(subscribe, getFavoriteIdsSnapshot, () => [] as number[]);

  useEffect(() => {
    ensureSyncStarted();
  }, []);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const favoriteProducts = useMemo(() => {
    return favoriteIds
      .map((id) => productById.get(id))
      .filter((product): product is Product => product !== undefined);
  }, [favoriteIds]);

  const favoriteCount = favoriteIds.length;

  const isFavorite = (productId: number) => favoriteIdSet.has(productId);

  const toggleFavorite = (productId: number) => {
    const currentlyFavorite = favoriteIdSet.has(productId);
    const nextIds = currentlyFavorite
      ? favoriteIds.filter((id) => id !== productId)
      : [productId, ...favoriteIds];

    setFavoriteIds(nextIds);

    void (currentlyFavorite ? apiRemoveWishlistItem(productId) : apiAddWishlistItem(productId)).catch(() => {
      setFavoriteIds(favoriteIds);
    });
  };

  const removeFavorite = (productId: number) => {
    if (!favoriteIdSet.has(productId)) {
      return;
    }

    setFavoriteIds(favoriteIds.filter((id) => id !== productId));
    void apiRemoveWishlistItem(productId).catch(() => {
      setFavoriteIds(favoriteIds);
    });
  };

  const clearFavorites = () => {
    if (favoriteIds.length === 0) {
      return;
    }

    setFavoriteIds([]);
    void Promise.all(favoriteIds.map((productId) => apiRemoveWishlistItem(productId))).catch(() => {
      setFavoriteIds(favoriteIds);
    });
  };

  return {
    favoriteIds,
    favoriteProducts,
    favoriteCount,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}
