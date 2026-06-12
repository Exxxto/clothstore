import heroMen from "@/assets/hero-men.jpg";
import heroWomen from "@/assets/hero-women.jpg";
import heroKids from "@/assets/hero-kids.jpg";
import sweaterBeige from "@/assets/products/sweater-beige.jpg";
import jeansBlue from "@/assets/products/jeans-blue.jpg";
import bomberBlack from "@/assets/products/bomber-black.jpg";
import sneakersWhite from "@/assets/products/sneakers-white.jpg";
import { CATEGORY_SLUGS } from "@/lib/categoryRoutes";

export type CategoryCard = {
  label: string;
  slug: string;
  image: string;
  description: string;
};

export const FEATURED_CATEGORY_CARDS: CategoryCard[] = [
  {
    label: "Свитеры",
    slug: CATEGORY_SLUGS.sweaters,
    image: sweaterBeige,
    description: "Мягкий трикотаж и уютные базовые силуэты.",
  },
  {
    label: "Джинсы",
    slug: CATEGORY_SLUGS.jeans,
    image: jeansBlue,
    description: "Деним на каждый день и акцентные посадки.",
  },
  {
    label: "Куртки",
    slug: CATEGORY_SLUGS.jackets,
    image: bomberBlack,
    description: "Верхняя одежда для плотной многослойности.",
  },
  {
    label: "Кроссовки",
    slug: CATEGORY_SLUGS.sneakers,
    image: sneakersWhite,
    description: "Чистые формы и повседневный комфорт.",
  },
];

export const QUICK_CATEGORY_LINKS = [
  { label: "Мужское", slug: CATEGORY_SLUGS.men },
  { label: "Женское", slug: CATEGORY_SLUGS.women },
  { label: "Детское", slug: CATEGORY_SLUGS.kids },
  { label: "Свитеры", slug: CATEGORY_SLUGS.sweaters },
  { label: "Новинки", slug: CATEGORY_SLUGS.new },
];

export const EDITORIAL_CATEGORY_LINKS = [
  {
    label: "Мужское",
    slug: CATEGORY_SLUGS.men,
    image: heroMen,
    description: "Строгие формы, базовый гардероб и повседневные слои.",
  },
  {
    label: "Женское",
    slug: CATEGORY_SLUGS.women,
    image: heroWomen,
    description: "Мягкие линии и универсальные силуэты.",
  },
  {
    label: "Детское",
    slug: CATEGORY_SLUGS.kids,
    image: heroKids,
    description: "Комфортные вещи для активного дня.",
  },
];
