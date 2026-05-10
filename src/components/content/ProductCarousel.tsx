import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { products, formatPrice, typeLabels } from "@/data/products";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { CATEGORY_SLUGS } from "@/lib/categoryRoutes";
import FavoriteToggleButton from "@/components/product/FavoriteToggleButton";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { apiGetPublicProducts } from "@/lib/productApi";

const ProductCarousel = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [featured, setFeatured] = useState(() => products.filter((p) => p.isNew).slice(0, 8));
  const { addToCart } = useCart();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    apiGetPublicProducts()
      .then((rows) => {
        if (active) setFeatured(rows.filter((product) => product.isNew).slice(0, 8));
      })
      .catch(() => {
        if (active) setFeatured(products.filter((product) => product.isNew).slice(0, 8));
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section ref={ref} className="w-full px-6 py-4">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles size={13} strokeWidth={1.75} />
            Новинки
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl font-light text-foreground">Новые поступления</h2>
        </div>
        <Link
          to={`/category/${CATEGORY_SLUGS.new}`}
          className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
        >
          Все новинки →
        </Link>
      </div>
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent>
          {featured.map((product, i) => (
            <CarouselItem
              key={product.id}
              className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-4"
            >
              <div
                className={`block transition-all duration-600 ease-out ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: visible ? `${i * 80 + 100}ms` : "0ms" }}
              >
                <Card className="group relative overflow-hidden border-border/70 bg-background shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.08)] flex flex-col">
                  <Link to={`/product/${product.id}`} className="flex flex-col h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative aspect-[4/5] overflow-hidden bg-secondary shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                        {product.isNew && (
                          <div className="absolute left-3 top-3 px-2.5 py-1 text-[0.65rem] font-medium bg-foreground text-background rounded-full tracking-[0.12em]">
                            НОВИНКА
                          </div>
                        )}
                        {product.oldPrice && (
                          <div className="absolute right-3 top-3 px-2.5 py-1 text-[0.65rem] font-medium bg-destructive text-destructive-foreground rounded-full tracking-[0.12em]">
                            СКИДКА
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 gap-2 p-3">
                        <p className="text-xs font-light text-muted-foreground uppercase tracking-[0.14em] truncate">
                          {typeLabels[product.type]}
                        </p>
                        <div className="flex items-start justify-between gap-2 flex-1">
                          <h3 className="text-xs md:text-sm font-medium text-foreground leading-snug line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-light text-foreground whitespace-nowrap">
                              {formatPrice(product.price)}
                            </p>
                            {product.oldPrice && (
                              <p className="text-xs font-light text-muted-foreground line-through whitespace-nowrap">
                                {formatPrice(product.oldPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-auto pt-1">
                          <Button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void addToCart({ productId: product.id, quantity: 1 });
                            }}
                            className="h-9 flex-1 rounded-full bg-foreground text-background text-xs font-medium tracking-wide hover:bg-foreground/90"
                            variant="default"
                          >
                            В корзину
                          </Button>
                          <FavoriteToggleButton
                            productId={product.id}
                            className="h-9 w-9 shrink-0"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
