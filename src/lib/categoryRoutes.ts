export const CATEGORY_SLUGS = {
  all: "all",
  new: "new",
  men: "men",
  women: "women",
  kids: "kids",
  spring: "spring",
  summer: "summer",
  autumn: "autumn",
  winter: "winter",
  jackets: "jackets",
  jeans: "jeans",
  sneakers: "sneakers",
  tshirts: "tshirts",
  dresses: "dresses",
  sweaters: "sweaters",
  pants: "pants",
  shirts: "shirts",
  hoodies: "hoodies",
  skirts: "skirts",
} as const;

const CATEGORY_ALIASES: Record<string, string> = {
  все: CATEGORY_SLUGS.all,
  новинки: CATEGORY_SLUGS.new,
  men: CATEGORY_SLUGS.men,
  women: CATEGORY_SLUGS.women,
  kids: CATEGORY_SLUGS.kids,
  spring: CATEGORY_SLUGS.spring,
  summer: CATEGORY_SLUGS.summer,
  autumn: CATEGORY_SLUGS.autumn,
  winter: CATEGORY_SLUGS.winter,
  jackets: CATEGORY_SLUGS.jackets,
  jeans: CATEGORY_SLUGS.jeans,
  sneakers: CATEGORY_SLUGS.sneakers,
  tshirts: CATEGORY_SLUGS.tshirts,
  dresses: CATEGORY_SLUGS.dresses,
  sweaters: CATEGORY_SLUGS.sweaters,
  pants: CATEGORY_SLUGS.pants,
  shirts: CATEGORY_SLUGS.shirts,
  hoodies: CATEGORY_SLUGS.hoodies,
  skirts: CATEGORY_SLUGS.skirts,
};

const CATEGORY_LABELS: Record<string, string> = {
  [CATEGORY_SLUGS.all]: "Все товары",
  [CATEGORY_SLUGS.new]: "Новинки",
  [CATEGORY_SLUGS.men]: "Мужское",
  [CATEGORY_SLUGS.women]: "Женское",
  [CATEGORY_SLUGS.kids]: "Детское",
  [CATEGORY_SLUGS.spring]: "Весенняя коллекция",
  [CATEGORY_SLUGS.summer]: "Летняя коллекция",
  [CATEGORY_SLUGS.autumn]: "Осенняя коллекция",
  [CATEGORY_SLUGS.winter]: "Зимняя коллекция",
  [CATEGORY_SLUGS.jackets]: "Куртки",
  [CATEGORY_SLUGS.jeans]: "Джинсы",
  [CATEGORY_SLUGS.sneakers]: "Кроссовки",
  [CATEGORY_SLUGS.tshirts]: "Футболки",
  [CATEGORY_SLUGS.dresses]: "Платья",
  [CATEGORY_SLUGS.sweaters]: "Свитеры",
  [CATEGORY_SLUGS.pants]: "Брюки",
  [CATEGORY_SLUGS.shirts]: "Рубашки",
  [CATEGORY_SLUGS.hoodies]: "Худи",
  [CATEGORY_SLUGS.skirts]: "Юбки",
};

const CATEGORY_FILTER_VALUES: Record<string, string> = {
  [CATEGORY_SLUGS.jackets]: "jackets",
  [CATEGORY_SLUGS.jeans]: "jeans",
  [CATEGORY_SLUGS.sneakers]: "sneakers",
  [CATEGORY_SLUGS.tshirts]: "tshirts",
  [CATEGORY_SLUGS.dresses]: "dresses",
  [CATEGORY_SLUGS.sweaters]: "sweaters",
  [CATEGORY_SLUGS.pants]: "pants",
  [CATEGORY_SLUGS.shirts]: "shirts",
  [CATEGORY_SLUGS.hoodies]: "hoodies",
  [CATEGORY_SLUGS.skirts]: "skirts",
};

export function normalizeCategorySlug(slug?: string) {
  if (!slug) return CATEGORY_SLUGS.all;
  const normalized = slug.toLowerCase();
  return CATEGORY_ALIASES[normalized] || normalized;
}

export function getCategoryLabel(slug?: string) {
  const normalized = normalizeCategorySlug(slug);
  return CATEGORY_LABELS[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getCategoryFilterValue(slug?: string) {
  const normalized = normalizeCategorySlug(slug);
  return CATEGORY_FILTER_VALUES[normalized] || normalized;
}
