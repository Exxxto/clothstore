import { Heart, X, Search, UserRound, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ShoppingBag from "./ShoppingBag";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { CATEGORY_SLUGS } from "@/lib/categoryRoutes";
import { QUICK_CATEGORY_LINKS } from "@/lib/categoryCatalog";
import { formatPrice, genderLabels, products, typeLabels } from "@/data/products";
import { normalizeGenderValue } from "@/lib/productNormalization";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";

const CLOTHING_CATEGORIES = [
  { label: "Куртки", slug: CATEGORY_SLUGS.jackets },
  { label: "Джинсы", slug: CATEGORY_SLUGS.jeans },
  { label: "Кроссовки", slug: CATEGORY_SLUGS.sneakers },
  { label: "Футболки", slug: CATEGORY_SLUGS.tshirts },
  { label: "Платья", slug: CATEGORY_SLUGS.dresses },
  { label: "Свитеры", slug: CATEGORY_SLUGS.sweaters },
  { label: "Брюки", slug: CATEGORY_SLUGS.pants },
  { label: "Рубашки", slug: CATEGORY_SLUGS.shirts },
  { label: "Худи", slug: CATEGORY_SLUGS.hoodies },
  { label: "Юбки", slug: CATEGORY_SLUGS.skirts },
];

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("ё", "е")
    .trim();

const tokenizeSearchText = (value: string) =>
  normalizeSearchText(value)
    .split(/[\s,./\\-]+/u)
    .filter(Boolean);

const Navigation = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const categoriesRef = useRef<HTMLDivElement>(null);
  const { favoriteCount } = useFavorites();
  const { cartItems, totalItems, updateQuantity } = useCart();

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: "Мужское", href: `/category/${CATEGORY_SLUGS.men}` },
    { name: "Женское", href: `/category/${CATEGORY_SLUGS.women}` },
    { name: "Детское", href: `/category/${CATEGORY_SLUGS.kids}` },
    { name: "Новинки", href: `/category/${CATEGORY_SLUGS.new}` },
    { name: "Примерочная", href: "/fitting-room" },
  ];

  const popularSearches = [
    ...QUICK_CATEGORY_LINKS.slice(3, 8),
  ];

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    if (!query) {
      return [];
    }

    const rankedResults = products
      .map((product) => {
        const name = normalizeSearchText(product.name);
        const type = normalizeSearchText(product.type);
        const nameWords = tokenizeSearchText(product.name);
        const typeWords = tokenizeSearchText(product.type);

        let rank = 0;

        if (name.startsWith(query)) {
          rank = 4;
        } else if (nameWords.some((word) => word.startsWith(query))) {
          rank = 3;
        } else if (type.startsWith(query) || typeWords.some((word) => word.startsWith(query))) {
          rank = 2;
        } else if (query.length >= 4 && (name.includes(query) || type.includes(query))) {
          rank = 1;
        }

        return rank > 0 ? { product, rank } : null;
      })
      .filter((item): item is { product: (typeof products)[number]; rank: number } => item !== null)
      .sort((a, b) => b.rank - a.rank || a.product.name.localeCompare(b.product.name, "ru"));

    return rankedResults.slice(0, 6).map((item) => item.product);
  }, [searchQuery]);

  return (
    <nav className="relative bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-5 lg:px-6">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 rounded-full border border-transparent hover:border-border/70"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Меню"
        >
          <div className="w-5 h-5 relative">
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 top-2.5" : "top-1.5"}`} />
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 top-2.5 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 top-2.5" : "top-3.5"}`} />
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="relative px-3 py-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light rounded-full hover:bg-background/70"
            >
              {item.name}
            </Link>
          ))}
          {/* Categories dropdown */}
          <div ref={categoriesRef} className="relative">
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="flex items-center gap-1 px-3 py-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light rounded-full hover:bg-background/70"
            >
              Категории
              <ChevronDown
                size={14}
                strokeWidth={1.75}
                className={`transition-transform duration-200 ${isCategoriesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isCategoriesOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl border border-border/70 bg-background/95 backdrop-blur-md shadow-lg z-50 py-2">
                {CLOTHING_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/category/${cat.slug}`}
                    onClick={() => setIsCategoriesOpen(false)}
                    className="block px-4 py-2 text-sm font-light text-nav-foreground hover:text-nav-hover hover:bg-muted/50 transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/" className="block text-lg md:text-xl font-light tracking-[0.28em] text-foreground">
            СИЛУЭТ
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <button
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 rounded-full border border-transparent hover:border-border/70 hover:bg-background/70"
            aria-label="Поиск"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
          <Link
            to="/account?tab=favorites"
            className="relative p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 rounded-full border border-transparent hover:border-border/70 hover:bg-background/70"
            aria-label={`Избранное${favoriteCount > 0 ? `, ${favoriteCount} товаров` : ""}`}
          >
            <Heart
              size={20}
              strokeWidth={1.5}
              className={favoriteCount > 0 ? "fill-current text-rose-500" : ""}
            />
            {favoriteCount > 0 && (
              <span className="absolute right-0 top-0 inline-flex min-w-5 translate-x-1 -translate-y-1 items-center justify-center rounded-full border-2 border-background bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
                {favoriteCount}
              </span>
            )}
          </Link>
          <Link
            to="/account"
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 rounded-full border border-transparent hover:border-border/70 hover:bg-background/70"
            aria-label="Личный кабинет"
          >
            <UserRound size={20} strokeWidth={1.5} />
          </Link>
          <button
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 relative rounded-full border border-transparent hover:border-border/70 hover:bg-background/70"
            aria-label="Корзина"
            onClick={() => setIsShoppingBagOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[30%] text-[0.5rem] font-semibold text-foreground pointer-events-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 z-50">
          <button
            type="button"
            aria-label="Закрыть поиск"
            className="fixed inset-0 z-0 cursor-default bg-black/10 backdrop-blur-[1px]"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative z-10 border-b border-border/70 bg-background/95 backdrop-blur-md">
            <div className="px-4 py-8 md:px-5 lg:px-6">
              <div className="relative z-10 mx-auto max-w-2xl">
                <div className="mb-8 flex items-center gap-3 border-b border-border pb-2">
                  <Search size={20} strokeWidth={1.5} className="text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Поиск одежды..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Очистить поиск"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="ml-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    Отмена
                  </button>
                </div>
                {searchQuery.trim() ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-light text-muted-foreground">
                        {searchResults.length > 0 ? `Найдено товаров: ${searchResults.length}` : "Ничего не найдено"}
                      </h3>
                      <p className="text-xs text-muted-foreground">Переходите в карточку товара или уточните запрос</p>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 transition-colors hover:border-foreground/40 hover:bg-muted/30"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {typeLabels[product.type]} · {genderLabels[normalizeGenderValue(product.gender) || "men"]}
                                  </p>
                                </div>
                                <p className="shrink-0 text-sm font-medium text-foreground">
                                  {formatPrice(product.price)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
                        Попробуйте изменить запрос или искать по типу товара, полу или сезону.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="mb-4 text-sm font-light text-muted-foreground">Популярные запросы</h3>
                    <div className="flex flex-wrap gap-3">
                      {popularSearches.map((search) => (
                        <Link
                          key={search.slug}
                          to={`/category/${search.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="rounded-full border border-border px-4 py-2 text-sm font-light text-foreground transition-colors duration-200 hover:border-foreground"
                        >
                          {search.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border/70 z-50">
          <div className="space-y-4 px-4 py-8 md:px-5 lg:px-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-foreground hover:text-muted-foreground text-lg font-light block py-3 border-b border-border/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {/* Categories section in mobile */}
            <div>
              <p className="text-foreground text-lg font-light py-3 border-b border-border/50">Категории</p>
              <div className="grid grid-cols-2 gap-x-4 pt-3">
                {CLOTHING_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/category/${cat.slug}`}
                    className="text-muted-foreground hover:text-foreground text-sm font-light py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Bag */}
      <ShoppingBag
        isOpen={isShoppingBagOpen}
        onClose={() => setIsShoppingBagOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        onViewFavorites={() => {}}
      />
    </nav>
  );
};

export default Navigation;
