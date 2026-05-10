import {
  type ClothingType,
  type Gender,
  type Product,
  type Season,
} from "@/data/products";
import { normalizeClothingType, normalizeGender } from "@/lib/productCatalog";

export type PublicProductRow = {
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
};

const SEASON_ALIASES: Record<string, Season> = {
  spring: "spring",
  "весна": "spring",
  "весенний": "spring",
  summer: "summer",
  "лето": "summer",
  "летний": "summer",
  autumn: "autumn",
  fall: "autumn",
  "осень": "autumn",
  "осенний": "autumn",
  winter: "winter",
  "зима": "winter",
  "зимний": "winter",
};

function normalizeSeason(value: string): Season {
  return SEASON_ALIASES[value.trim().toLowerCase()] ?? "spring";
}

export function mapPublicProduct(row: PublicProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    type: normalizeClothingType(row.type) ?? ("tshirts" as ClothingType),
    gender: normalizeGender(row.gender) ?? ("men" as Gender),
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    image: row.image_url || "/placeholder.svg",
    season: normalizeSeason(row.season),
    isNew: row.is_new,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description || "",
  };
}

export async function apiGetPublicProducts(filters?: {
  gender?: string;
  type?: string;
  season?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.gender) params.set("gender", filters.gender);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.season) params.set("season", filters.season);
  if (filters?.search) params.set("search", filters.search);

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Не удалось загрузить товары");
  }

  const rows = (await response.json()) as PublicProductRow[];
  return rows.map(mapPublicProduct);
}

export async function apiGetPublicProduct(id: number) {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    throw new Error("Товар не найден");
  }

  const row = (await response.json()) as PublicProductRow;
  return mapPublicProduct(row);
}
