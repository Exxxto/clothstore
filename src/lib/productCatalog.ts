export type Gender = "men" | "women" | "kids";
export type ClothingType = "tshirts" | "jeans" | "jackets" | "sneakers" | "sweaters" | "dresses" | "pants" | "shirts" | "hoodies" | "skirts";
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface Product {
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
  description: string;
  material?: string;
  inStock?: boolean;
}

export const genderLabels: Record<Gender, string> = {
  men: "Мужское",
  women: "Женское",
  kids: "Детское",
};

export const seasonLabels: Record<Season, string> = {
  spring: "Весенняя коллекция",
  summer: "Летняя коллекция",
  autumn: "Осенняя коллекция",
  winter: "Зимняя коллекция",
};

export const typeLabels: Record<ClothingType, string> = {
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

const GENDER_ALIASES: Record<string, Gender> = {
  men: "men",
  women: "women",
  kids: "kids",
  мужское: "men",
  женское: "women",
  детское: "kids",
};

const TYPE_ALIASES: Record<string, ClothingType> = {
  tshirts: "tshirts",
  футболки: "tshirts",
  jeans: "jeans",
  джинсы: "jeans",
  jackets: "jackets",
  куртки: "jackets",
  sneakers: "sneakers",
  кроссовки: "sneakers",
  sweaters: "sweaters",
  свитеры: "sweaters",
  dresses: "dresses",
  платья: "dresses",
  pants: "pants",
  брюки: "pants",
  shirts: "shirts",
  рубашки: "shirts",
  hoodies: "hoodies",
  худи: "hoodies",
  skirts: "skirts",
  юбки: "skirts",
};

export function normalizeGender(value: string): Gender | null {
  return GENDER_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function normalizeClothingType(value: string): ClothingType | null {
  return TYPE_ALIASES[value.trim().toLowerCase()] ?? null;
}

const TYPE_NOUNS: Record<ClothingType, string> = {
  tshirts: "футболка",
  jeans: "джинсы",
  jackets: "куртка",
  sneakers: "кеды",
  sweaters: "свитер",
  dresses: "платье",
  pants: "брюки",
  shirts: "рубашка",
  hoodies: "худи",
  skirts: "юбка",
};

const TYPE_BASE_PRICE: Record<ClothingType, number> = {
  tshirts: 2190,
  jeans: 4990,
  jackets: 8990,
  sneakers: 6490,
  sweaters: 4490,
  dresses: 6990,
  pants: 4490,
  shirts: 3990,
  hoodies: 4290,
  skirts: 3590,
};

const TYPE_SEASON_POOL: Record<ClothingType, Season[]> = {
  tshirts: ["spring", "summer"],
  jeans: ["spring", "summer", "autumn", "winter"],
  jackets: ["autumn", "winter"],
  sneakers: ["spring", "summer", "autumn"],
  sweaters: ["autumn", "winter"],
  dresses: ["spring", "summer"],
  pants: ["spring", "autumn", "winter"],
  shirts: ["spring", "summer", "autumn"],
  hoodies: ["autumn", "winter"],
  skirts: ["spring", "summer", "autumn"],
};

const SIZE_PRESETS: Record<Gender, Record<ClothingType, string[]>> = {
  men: {
    tshirts: ["S", "M", "L", "XL", "XXL"],
    jeans: ["28", "30", "32", "34", "36"],
    jackets: ["S", "M", "L", "XL", "XXL"],
    sneakers: ["40", "41", "42", "43", "44", "45"],
    sweaters: ["S", "M", "L", "XL", "XXL"],
    dresses: ["S", "M", "L"],
    pants: ["28", "30", "32", "34", "36"],
    shirts: ["S", "M", "L", "XL", "XXL"],
    hoodies: ["S", "M", "L", "XL", "XXL"],
    skirts: ["S", "M", "L"],
  },
  women: {
    tshirts: ["XS", "S", "M", "L", "XL"],
    jeans: ["24", "26", "28", "30", "32"],
    jackets: ["XS", "S", "M", "L", "XL"],
    sneakers: ["36", "37", "38", "39", "40", "41"],
    sweaters: ["XS", "S", "M", "L", "XL"],
    dresses: ["XS", "S", "M", "L", "XL"],
    pants: ["24", "26", "28", "30", "32"],
    shirts: ["XS", "S", "M", "L", "XL"],
    hoodies: ["XS", "S", "M", "L", "XL"],
    skirts: ["XS", "S", "M", "L", "XL"],
  },
  kids: {
    tshirts: ["104", "110", "116", "122", "128"],
    jeans: ["104", "110", "116", "122", "128"],
    jackets: ["104", "110", "116", "122", "128"],
    sneakers: ["28", "30", "32", "34"],
    sweaters: ["104", "110", "116", "122", "128"],
    dresses: ["104", "110", "116", "122", "128"],
    pants: ["104", "110", "116", "122", "128"],
    shirts: ["104", "110", "116", "122", "128"],
    hoodies: ["104", "110", "116", "122", "128"],
    skirts: ["104", "110", "116", "122", "128"],
  },
};

const MEN_PREFIXES = [
  "Базовая",
  "Свободная",
  "Лаконичная",
  "Городская",
  "Классическая",
  "Плотная",
  "Текстурная",
  "Лёгкая",
  "Архивная",
  "Смарт",
  "Повседневная",
  "Чистая",
  "Утеплённая",
  "Премиальная",
];

const WOMEN_PREFIXES = [
  "Лёгкая",
  "Струящаяся",
  "Изящная",
  "Мягкая",
  "Лаконичная",
  "Актуальная",
  "Графичная",
  "Чистая",
  "Объёмная",
  "Воздушная",
  "Элегантная",
  "Свободная",
  "Текстурная",
  "Современная",
];

const KIDS_PREFIXES = [
  "Яркая",
  "Мягкая",
  "Удобная",
  "Лёгкая",
  "Активная",
  "Весёлая",
  "Комфортная",
  "Практичная",
];

const MATERIALS: Record<Gender, Record<ClothingType, string[]>> = {
  men: {
    tshirts: ["из плотного хлопка", "из мягкого джерси", "из органического хлопка"],
    jeans: ["из плотного денима", "из эластичного денима", "из washed denim"],
    jackets: ["из матовой ткани", "с водоотталкивающей пропиткой", "из плотного твила"],
    sneakers: ["с текстильным верхом", "из гладкой кожи", "из комбинированных материалов"],
    sweaters: ["из мериносовой шерсти", "из мягкого трикотажа", "с фактурной вязкой"],
    dresses: ["из мягкого трикотажа", "из плотного сатина", "с драпировкой"],
    pants: ["из хлопка с эластаном", "из плотного твила", "из мягкого костюмного материала"],
    shirts: ["из хлопка оксфорд", "из натурального льна", "из тонкого твила"],
    hoodies: ["из футера с начёсом", "из плотного футера", "из мягкого трикотажа"],
    skirts: ["из плотного хлопка", "из костюмной ткани", "из мягкого твила"],
  },
  women: {
    tshirts: ["из мягкого хлопка", "из плотного джерси", "с ровной посадкой"],
    jeans: ["из мягкого денима", "из эластичного денима", "с высокой посадкой"],
    jackets: ["из плотного твила", "с лёгким утеплителем", "с гладкой фактурой"],
    sneakers: ["с лаконичным силуэтом", "с мягкой посадкой", "из комбинированных материалов"],
    sweaters: ["из мериносовой шерсти", "с объёмной вязкой", "из мягкого трикотажа"],
    dresses: ["с плавной линией", "из струящейся ткани", "с мягкой драпировкой"],
    pants: ["с высокой посадкой", "из костюмной ткани", "с аккуратной стрелкой"],
    shirts: ["из тонкого хлопка", "из мягкого льна", "с чистой линией воротника"],
    hoodies: ["из мягкого футера", "с уютной фактурой", "с расслабленной посадкой"],
    skirts: ["с мягким объёмом", "из плотной ткани", "с чистым силуэтом"],
  },
  kids: {
    tshirts: ["из мягкого хлопка", "с комфортной посадкой", "из лёгкого джерси"],
    jeans: ["из мягкого денима", "с эластичным поясом", "с удобной посадкой"],
    jackets: ["из плотной ткани", "с лёгким утеплением", "для активных прогулок"],
    sneakers: ["с гибкой подошвой", "с удобной фиксацией", "для подвижного дня"],
    sweaters: ["из мягкого трикотажа", "с уютной вязкой", "для прохладной погоды"],
    dresses: ["из мягкой ткани", "с комфортной посадкой", "с аккуратной отделкой"],
    pants: ["из мягкого хлопка", "с эластичной талией", "с удобной посадкой"],
    shirts: ["из лёгкого хлопка", "с мягким воротником", "для повседневной носки"],
    hoodies: ["из мягкого футера", "с капюшоном", "для активного дня"],
    skirts: ["с мягким объёмом", "из приятной ткани", "для лёгких образов"],
  },
};

const DESCRIPTIONS: Record<Gender, string[]> = {
  men: [
    "Подходит для повседневного гардероба и легко сочетается с базовыми слоями.",
    "Собрана в чистом силуэте без лишнего визуального шума.",
    "Хорошо держит форму и рассчитана на регулярную носку.",
    "Подходит для городских образов и спокойной капсулы.",
  ],
  women: [
    "Подходит для повседневных и более собранных образов.",
    "Сделана в мягком силуэте и хорошо комбинируется с базой.",
    "Легко вписывается в капсульный гардероб на каждый день.",
    "Поддерживает чистую линию образа и комфорт в носке.",
  ],
  kids: [
    "Удобная модель для активного дня и регулярной носки.",
    "Практичная вещь для школы, прогулок и движения без ограничений.",
    "Сделана с акцентом на комфорт и лёгкость в уходе.",
  ],
};

const MEN_TYPES: ClothingType[] = ["tshirts", "shirts", "hoodies", "sweaters", "jackets", "jeans", "pants", "sneakers"];
const WOMEN_TYPES: ClothingType[] = ["tshirts", "shirts", "hoodies", "sweaters", "jackets", "jeans", "pants", "sneakers", "dresses", "skirts"];
const KIDS_TYPES: ClothingType[] = ["tshirts", "shirts", "hoodies", "sweaters", "jackets", "jeans", "pants", "sneakers"];

const BASE_IMAGE_SEQUENCE = [
  "tshirt-white-bg.jpg",
  "shirt-gray-bg.jpg",
  "hoodie-white-bg.jpg",
  "jacket-gray-bg.jpg",
  "jeans-white-bg.jpg",
  "pants-black-bg.jpg",
  "dress-tan-bg.jpg",
  "skirt-black-bg.jpg",
  "sneakers-white-bg.jpg",
  "sweater-white-bg.jpg",
  "bomber-black.jpg",
  "jeans-blue.jpg",
  "sweater-beige.jpg",
  "tshirt-white.jpg",
  "sneakers-white.jpg",
] as const;

const GENERATED_VARIANT_COUNT = 466;

const PRODUCT_IMAGE_BASES: Record<Gender, Record<ClothingType, readonly (typeof BASE_IMAGE_SEQUENCE)[number][]>> = {
  men: {
    tshirts: ["tshirt-white-bg.jpg", "tshirt-white.jpg"],
    jeans: ["jeans-white-bg.jpg", "jeans-blue.jpg"],
    jackets: ["jacket-gray-bg.jpg", "bomber-black.jpg"],
    sneakers: ["sneakers-white-bg.jpg", "sneakers-white.jpg"],
    sweaters: ["sweater-white-bg.jpg", "sweater-beige.jpg"],
    dresses: ["dress-tan-bg.jpg"],
    pants: ["pants-black-bg.jpg"],
    shirts: ["shirt-gray-bg.jpg"],
    hoodies: ["hoodie-white-bg.jpg"],
    skirts: ["skirt-black-bg.jpg"],
  },
  women: {
    tshirts: ["tshirt-white-bg.jpg", "tshirt-white.jpg"],
    jeans: ["jeans-white-bg.jpg", "jeans-blue.jpg"],
    jackets: ["jacket-gray-bg.jpg", "bomber-black.jpg"],
    sneakers: ["sneakers-white-bg.jpg", "sneakers-white.jpg"],
    sweaters: ["sweater-white-bg.jpg", "sweater-beige.jpg"],
    dresses: ["dress-tan-bg.jpg"],
    pants: ["pants-black-bg.jpg"],
    shirts: ["shirt-gray-bg.jpg"],
    hoodies: ["hoodie-white-bg.jpg"],
    skirts: ["skirt-black-bg.jpg"],
  },
  kids: {
    tshirts: ["tshirt-white-bg.jpg", "tshirt-white.jpg"],
    jeans: ["jeans-white-bg.jpg", "jeans-blue.jpg"],
    jackets: ["jacket-gray-bg.jpg", "bomber-black.jpg"],
    sneakers: ["sneakers-white-bg.jpg", "sneakers-white.jpg"],
    sweaters: ["sweater-white-bg.jpg", "sweater-beige.jpg"],
    dresses: ["dress-tan-bg.jpg"],
    pants: ["pants-black-bg.jpg"],
    shirts: ["shirt-gray-bg.jpg"],
    hoodies: ["hoodie-white-bg.jpg"],
    skirts: ["skirt-black-bg.jpg"],
  },
};

function buildGeneratedVariantPool(baseNames: readonly (typeof BASE_IMAGE_SEQUENCE)[number][]) {
  const selected = new Set(baseNames);
  const pool: string[] = [];

  for (let index = 1; index <= GENERATED_VARIANT_COUNT; index += 1) {
    const baseName = BASE_IMAGE_SEQUENCE[(index - 1) % BASE_IMAGE_SEQUENCE.length];
    if (selected.has(baseName)) {
      pool.push(`/assets/products/generated/variant-${String(index).padStart(3, "0")}.jpg`);
    }
  }

  return pool;
}

const PRODUCT_IMAGE_POOL: Record<Gender, Record<ClothingType, string[]>> = {
  men: {
    tshirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.tshirts),
    jeans: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.jeans),
    jackets: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.jackets),
    sneakers: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.sneakers),
    sweaters: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.sweaters),
    dresses: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.dresses),
    pants: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.pants),
    shirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.shirts),
    hoodies: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.hoodies),
    skirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.men.skirts),
  },
  women: {
    tshirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.tshirts),
    jeans: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.jeans),
    jackets: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.jackets),
    sneakers: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.sneakers),
    sweaters: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.sweaters),
    dresses: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.dresses),
    pants: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.pants),
    shirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.shirts),
    hoodies: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.hoodies),
    skirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.women.skirts),
  },
  kids: {
    tshirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.tshirts),
    jeans: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.jeans),
    jackets: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.jackets),
    sneakers: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.sneakers),
    sweaters: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.sweaters),
    dresses: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.dresses),
    pants: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.pants),
    shirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.shirts),
    hoodies: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.hoodies),
    skirts: buildGeneratedVariantPool(PRODUCT_IMAGE_BASES.kids.skirts),
  },
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(hex: string): string {
  return hex.replace("#", "");
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHexColors(base: string, target: string, amount: number): string {
  const a = hexToRgb(base);
  const b = hexToRgb(target);
  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount
  );
}

export function pickProductImage(gender: Gender, type: ClothingType, sequenceIndex: number): string {
  return `/assets/products/catalog/${gender}-${type}-${String(sequenceIndex + 1).padStart(3, "0")}.jpg`;
}

function buildSeason(gender: Gender, type: ClothingType, seed: number): Season {
  return pick(TYPE_SEASON_POOL[type], seed + hashString(gender));
}

function buildSizes(gender: Gender, type: ClothingType): string[] {
  return [...SIZE_PRESETS[gender][type]];
}

function buildName(gender: Gender, type: ClothingType, index: number, seed: number): string {
  const noun = TYPE_NOUNS[type];
  const prefixes = gender === "men" ? MEN_PREFIXES : gender === "women" ? WOMEN_PREFIXES : KIDS_PREFIXES;
  const prefix = pick(prefixes, seed);
  const material = pick(MATERIALS[gender][type], seed >> 1);
  const tailVariants = {
    men: ["для базового гардероба", "на каждый день", "с чистым силуэтом", "для спокойных образов", "с акцентом на комфорт"],
    women: ["для капсульного гардероба", "на каждый день", "с мягким силуэтом", "для собранных образов", "с чистой линией"],
    kids: ["для активного дня", "для прогулок", "для комфортной носки", "без лишних деталей"],
  } as const;
  const tail = pick(tailVariants[gender], seed >> 2);
  const connectors = gender === "kids" ? "" : " ";
  const nameCore = `${prefix} ${noun}${connectors}${material}`.trim();
  return `${nameCore} ${tail}`.replace(/\s+/g, " ").trim();
}

function buildDescription(gender: Gender, type: ClothingType, season: Season, seed: number): string {
  const variants = DESCRIPTIONS[gender];
  const variant = pick(variants, seed);
  const noun = TYPE_NOUNS[type];
  const seasonText = seasonLabels[season].toLowerCase();
  return `${typeLabels[type]}: ${noun} ${pick(["сдержанной подачей", "чистой посадкой", "мягкой фактурой", "аккуратной отделкой"], seed >> 3)}. ${variant} Подходит для ${seasonText}.`;
}

function buildPrice(type: ClothingType, seed: number, gender: Gender): { price: number; oldPrice?: number } {
  const base = TYPE_BASE_PRICE[type] + (gender === "women" ? 180 : gender === "kids" ? -700 : 0);
  const price = base + (seed % 11) * 180 + ((seed >> 4) % 4) * 240;
  if (seed % 5 === 0) {
    return { price, oldPrice: price + 1000 + (seed % 3) * 490 };
  }
  return { price };
}

function buildIsNew(seed: number): boolean {
  return seed % 7 === 0 || seed % 13 === 0;
}

function buildProduct(gender: Gender, type: ClothingType, index: number, sequenceIndex: number): Product {
  const seed = hashString(`${gender}:${type}:${index}`);
  const season = buildSeason(gender, type, seed);
  const { price, oldPrice } = buildPrice(type, seed, gender);
  const image = pickProductImage(gender, type, sequenceIndex);

  return {
    id: 0,
    name: buildName(gender, type, index, seed),
    type,
    gender,
    price,
    oldPrice,
    image,
    season,
    isNew: buildIsNew(seed),
    sizes: buildSizes(gender, type),
    description: buildDescription(gender, type, season, seed),
  };
}

function generateByGender(gender: Gender, count: number, typeCycle: ClothingType[]): Product[] {
  const typeCounts = new Map<ClothingType, number>();
  return Array.from({ length: count }, (_, index) => {
    const type = pick(typeCycle, index);
    const sequenceIndex = typeCounts.get(type) ?? 0;
    typeCounts.set(type, sequenceIndex + 1);
    return buildProduct(gender, type, index, sequenceIndex);
  });
}

export function generateProducts(options?: { menCount?: number; womenCount?: number; kidsCount?: number }) {
  const menCount = options?.menCount ?? 210;
  const womenCount = options?.womenCount ?? 210;
  const kidsCount = options?.kidsCount ?? 30;

  const products = [
    ...generateByGender("men", menCount, MEN_TYPES),
    ...generateByGender("women", womenCount, WOMEN_TYPES),
    ...generateByGender("kids", kidsCount, KIDS_TYPES),
  ].map((product, index) => ({
    ...product,
    id: index + 1,
  }));

  return products;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export const products = generateProducts();
