import { useEffect, useMemo, useSyncExternalStore } from "react";

import { type ClothingType, type Gender, type Season } from "@/lib/productCatalog";
import { apiAddWishlistItem, apiGetWishlist, apiRemoveWishlistItem, type WishlistRow } from "@/lib/storeApi";

export type FavoriteProduct = {
  id: number;
  name: string;
  type: ClothingType;
  gender: Gender;
  price: number;
  oldPrice?: number;
  image: string;
  season: Season;
  isNew?: boolean;
  sizes: string[];
};

const favoritesStorageKey = "clothstore.favorites.v1";

// Stores both IDs and full product data fetched from the server
let cachedFavoriteIds: number[] | null = null;
let cachedFavoriteProducts: Map<number, FavoriteProduct> = new Map();
const listeners = new Set<() => void>();
let syncStarted = false;
let syncInFlight: Promise<void> | null = null;

function resolveProductImage(row: WishlistRow): string {
  if (row.product_image_url) {
    return row.product_image_url;
  }
  if (row.product_slug) {
    return `/assets/products/catalog/${row.product_slug}.jpg`;
  }
  if (row.product_gender && row.product_type) {
    return `/assets/products/catalog/${row.product_gender}-${row.product_type}-001.jpg`;
  }
  return "/placeholder.svg";
}

function rowToFavoriteProduct(row: WishlistRow): FavoriteProduct | null {
  if (!row.product_name || !row.product_type || !row.product_gender || row.product_price == null) {
    return null;
  }
  return {
    id: row.product_id,
    name: row.product_name,
    type: row.product_type as ClothingType,
    gender: row.product_gender as Gender,
    price: row.product_price,
    oldPrice: row.product_old_price ?? undefined,
    image: resolveProductImage(row),
    season: (row.product_season ?? "spring") as Season,
    isNew: row.product_is_new ?? false,
    sizes: row.product_sizes ?? [],
  };
}

function sanitizeFavoriteIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const rawValue of value) {
    const parsed = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(parsed)) continue;
    const id = Math.trunc(parsed);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function readFavoriteIdsFromStorage(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(favoritesStorageKey);
    if (!raw) return [];
    return sanitizeFavoriteIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function getFavoriteIdsSnapshot(): number[] {
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

function setFavoriteIdsWithProducts(rows: WishlistRow[]) {
  const ids: number[] = [];
  const productMap = new Map<number, FavoriteProduct>();
  for (const row of rows) {
    const product = rowToFavoriteProduct(row);
    if (product) {
      ids.push(row.product_id);
      productMap.set(row.product_id, product);
    }
  }
  cachedFavoriteProducts = productMap;
  persistFavoriteIds(ids);
  notifySubscribers();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function syncFavoritesFromServer() {
  if (syncInFlight) return syncInFlight;

  syncInFlight = apiGetWishlist()
    .then((rows) => {
      setFavoriteIdsWithProducts(rows);
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
  if (syncStarted) return;
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
      .map((id) => cachedFavoriteProducts.get(id))
      .filter((p): p is FavoriteProduct => p !== undefined);
  }, [favoriteIds]);

  const favoriteCount = favoriteIds.length;

  const isFavorite = (productId: number) => favoriteIdSet.has(productId);

  const toggleFavorite = (productId: number) => {
    const currentlyFavorite = favoriteIdSet.has(productId);
    const nextIds = currentlyFavorite
      ? favoriteIds.filter((id) => id !== productId)
      : [productId, ...favoriteIds];

    setFavoriteIds(nextIds);

    void (currentlyFavorite ? apiRemoveWishlistItem(productId) : apiAddWishlistItem(productId))
      .then((rows) => {
        // Refresh product data from server response
        setFavoriteIdsWithProducts(rows);
      })
      .catch(() => {
        setFavoriteIds(favoriteIds);
      });
  };

  const removeFavorite = (productId: number) => {
    if (!favoriteIdSet.has(productId)) return;
    setFavoriteIds(favoriteIds.filter((id) => id !== productId));
    void apiRemoveWishlistItem(productId)
      .then((rows) => {
        setFavoriteIdsWithProducts(rows);
      })
      .catch(() => {
        setFavoriteIds(favoriteIds);
      });
  };

  const clearFavorites = () => {
    if (favoriteIds.length === 0) return;
    setFavoriteIds([]);
    cachedFavoriteProducts = new Map();
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
