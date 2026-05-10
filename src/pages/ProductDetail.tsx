import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import ProductGrid from "../components/category/ProductGrid";
import { Card, CardContent } from "@/components/ui/card";
import { products, type Product } from "@/data/products";
import { apiGetPublicProduct, apiGetPublicProducts } from "@/lib/productApi";

const ProductDetail = () => {
  const { productId } = useParams();
  const id = Number(productId);
  const fallbackProduct = products.find((item) => item.id === id) ?? null;
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(() =>
    products.filter((p) => p.id !== id).slice(0, 6)
  );

  useEffect(() => {
    let active = true;
    apiGetPublicProducts()
      .then((rows) => {
        if (active) setRelatedProducts(rows.filter((p) => p.id !== id).slice(0, 6));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;

    if (!Number.isFinite(id)) {
      setLoadingProduct(false);
      setProduct(null);
      return () => {
        active = false;
      };
    }

    setLoadingProduct(true);
    apiGetPublicProduct(id)
      .then((row) => {
        if (active) setProduct(row);
      })
      .catch(() => {
        if (active) setProduct(fallbackProduct);
      })
      .finally(() => {
        if (active) setLoadingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [fallbackProduct, id]);

  if (!loadingProduct && !product) {
    return <Navigate replace to="/category/all" />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-12">
          <div className="rounded-3xl border border-border bg-background/80 px-6 py-5 text-sm text-muted-foreground">
            Загрузка товара...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const productImages = [product.image];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.05),transparent_28%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.035),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(248,248,246,1))]" />

        <section className="w-full mx-auto max-w-7xl px-3 md:px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8">
            <Card className="border-border/70 bg-background/80 shadow-[0_18px_50px_rgba(0,0,0,0.05)] overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <ProductImageGallery images={productImages} alt={product.name} />
              </CardContent>
            </Card>

            <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
              <Card className="border-border/70 bg-background/80 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardContent className="p-5 md:p-6">
                  <ProductInfo product={product} />
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/80 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardContent className="p-5 md:p-6">
                  <ProductDescription product={product} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full mx-auto max-w-7xl px-3 md:px-4 mt-4">
          <div className="mb-2 px-2 md:px-3">
            <h2 className="text-xs md:text-sm uppercase tracking-[0.18em] font-medium text-muted-foreground">
              Вам также может понравиться
            </h2>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
