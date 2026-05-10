import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../admin_site/src/db/index.ts";
import { normalizeClothingType, normalizeGender, pickProductImage } from "../src/lib/productCatalog.ts";

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
];

const GENERATED_VARIANT_COUNT = 466;

const PRODUCT_IMAGE_BASES = {
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

function buildGeneratedVariantPool(baseNames) {
  const selected = new Set(baseNames);
  const pool = [];

  for (let index = 1; index <= GENERATED_VARIANT_COUNT; index += 1) {
    const baseName = BASE_IMAGE_SEQUENCE[(index - 1) % BASE_IMAGE_SEQUENCE.length];
    if (selected.has(baseName)) {
      pool.push(`/assets/products/generated/variant-${String(index).padStart(3, "0")}.jpg`);
    }
  }

  return pool;
}

const SOURCE_VARIANT_POOLS = {
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

const generatedCounts = new Map();

const { rows } = await pool.query(`
  SELECT id, slug, gender, type
  FROM products
  ORDER BY gender, type, id
`);

for (const row of rows) {
  const normalizedGender = normalizeGender(row.gender);
  const normalizedType = normalizeClothingType(row.type);
  const key = normalizedGender && normalizedType ? `${normalizedGender}:${normalizedType}` : null;
  let imageUrl = null;

  if (normalizedGender && normalizedType && key) {
    const sequenceIndex = generatedCounts.get(key) ?? 0;
    generatedCounts.set(key, sequenceIndex + 1);
    const sourcePool = SOURCE_VARIANT_POOLS[normalizedGender][normalizedType];
    const sourceVariant = sourcePool[sequenceIndex];
    imageUrl = sourceVariant ? pickProductImage(normalizedGender, normalizedType, sequenceIndex) : null;
  }

  if (!imageUrl) {
    imageUrl = row.id % 2 === 0
      ? "/assets/products/generated/variant-001.jpg"
      : "/assets/products/generated/variant-002.jpg";
  }

  const sourceVariantIndex = generatedCounts.get(key) ?? 0;
  const src = normalizedGender && normalizedType && key
    ? path.resolve(`public${SOURCE_VARIANT_POOLS[normalizedGender][normalizedType][sourceVariantIndex - 1]}`)
    : path.resolve("public/assets/products/generated/variant-001.jpg");
  const dst = path.resolve(`public${imageUrl}`);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
}

await pool.end();
console.log(`copied ${rows.length} catalog images`);
