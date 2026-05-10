import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Product, formatPrice, genderLabels, typeLabels } from "@/data/products";
import { normalizeGenderValue } from "@/lib/productNormalization";
import FavoriteToggleButton from "@/components/product/FavoriteToggleButton";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
  const { addToCart } = useCart();

  return (
    <section className="w-full">
      {products.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-background/60">
          <p className="text-muted-foreground text-lg font-light">Товары не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group relative cursor-pointer overflow-hidden border-border/70 bg-background shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col"
            >
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
                      {typeLabels[product.type]} · {genderLabels[normalizeGenderValue(product.gender) || "men"]}
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
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
