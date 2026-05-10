import type { Category } from "../api";

const TYPE_CATEGORY_SLUGS: Record<string, string[]> = {
  tshirts: ["futbolki"],
  shirts: ["futbolki"],
  jeans: ["dzhinsy"],
  pants: ["dzhinsy"],
  jackets: ["kurtki"],
  sneakers: ["obuv"],
  sweaters: ["svitery"],
  hoodies: ["svitery"],
  dresses: ["svitery", "futbolki"],
  skirts: ["futbolki", "svitery"],
};

export function getSuggestedCategoryId(type: string, categories: Category[]) {
  const slugs = TYPE_CATEGORY_SLUGS[type.trim().toLowerCase()];
  if (!slugs) return null;

  for (const slug of slugs) {
    const category = categories.find((item) => item.slug === slug && item.is_active);
    if (category) return category.id;
  }

  return null;
}
