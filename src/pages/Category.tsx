import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { products } from "@/data/products";
import { getCategoryFilterValue, getCategoryLabel, normalizeCategorySlug } from "@/lib/categoryRoutes";
import { normalizeGenderValue } from "@/lib/productNormalization";
import { apiGetPublicProducts } from "@/lib/productApi";

const Category = () => {
  const { category } = useParams();
  const [sortBy, setSortBy] = useState("featured");
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const canonicalCategory = normalizeCategorySlug(category);
  const categoryFilterValue = getCategoryFilterValue(category);
  const shouldRedirect = category && category !== canonicalCategory;

  useEffect(() => {
    let active = true;

    apiGetPublicProducts()
      .then((rows) => {
        if (active) {
          setCatalogProducts(rows);
        }
      })
      .catch(() => {
        if (active) setCatalogProducts(products);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    let result = catalogProducts;

    if (canonicalCategory && canonicalCategory !== "all") {
      if (canonicalCategory === "new") {
        result = result.filter((p) => p.isNew);
      } else {
        // Match by gender
        const genderMatch = result.filter((p) => normalizeGenderValue(p.gender) === canonicalCategory);
        if (genderMatch.length > 0) {
          result = genderMatch;
        } else {
          // Match by season
          const seasonMatch = result.filter((p) => p.season === canonicalCategory);
          if (seasonMatch.length > 0) {
            result = seasonMatch;
          } else {
            // Match by type
            const typeMatch = result.filter((p) => p.type === categoryFilterValue);
            if (typeMatch.length > 0) {
              result = typeMatch;
            }
          }
        }
      }
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || b.id - a.id;
        case "name":
          return a.name.localeCompare(b.name, "ru");
        case "featured":
        default:
          return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || a.id - b.id;
      }
    });

    return sorted;
  }, [canonicalCategory, catalogProducts, categoryFilterValue, sortBy]);

  const categoryLabel = getCategoryLabel(canonicalCategory);

  if (shouldRedirect) {
    return <Navigate replace to={`/category/${canonicalCategory}`} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_28%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.04),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.94),rgba(248,248,246,1))]" />
        <div className="w-full mx-auto px-3 md:px-4 pt-3 md:pt-4 pb-6 md:pb-10">
          <CategoryHeader category={categoryLabel} />

          <div className="rounded-[2rem] border border-border/70 bg-background/80 backdrop-blur-sm shadow-[0_18px_50px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-2 md:px-3 pt-3 md:pt-4">
              <FilterSortBar
                itemCount={visibleProducts.length}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </div>
            <div className="px-2 md:px-3 pb-4 md:pb-6">
              <ProductGrid products={visibleProducts} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Category;
