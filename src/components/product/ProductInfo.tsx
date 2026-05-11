import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Sparkles, ShieldCheck, Users2, Tag, Sun } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, genderLabels, seasonLabels, type Product, typeLabels } from "@/data/products";
import { useCart } from "@/hooks/useCart";

type ProductInfoProps = {
  product: Product;
};

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0] ?? null);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    setQuantity(1);
    setSelectedSize(product.sizes[0] ?? null);
  }, [product.id, product.sizes]);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        quantity,
        size: selectedSize,
      });
      toast.success("Товар добавлен в корзину");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось добавить товар в корзину");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles size={13} strokeWidth={1.75} />
              {typeLabels[product.type]}
            </div>
            {product.inStock === false ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs uppercase tracking-[0.16em] text-red-600">
                Нет в наличии
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs uppercase tracking-[0.16em] text-green-700">
                В наличии
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            {product.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Цена</p>
          <p className="text-2xl font-light text-foreground">{formatPrice(product.price)}</p>
          {product.oldPrice ? (
            <p className="text-sm font-light text-muted-foreground line-through">{formatPrice(product.oldPrice)}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Users2 size={13} strokeWidth={1.75} className="text-muted-foreground" />
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Раздел</p>
          </div>
          <p className="text-sm font-light text-foreground">{genderLabels[product.gender]}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Tag size={13} strokeWidth={1.75} className="text-muted-foreground" />
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Тип</p>
          </div>
          <p className="text-sm font-light text-foreground">{typeLabels[product.type]}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sun size={13} strokeWidth={1.75} className="text-muted-foreground" />
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Сезон</p>
          </div>
          <p className="text-sm font-light text-foreground">{seasonLabels[product.season]}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-background p-5 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} strokeWidth={1.8} className="text-muted-foreground" />
          <span className="text-sm font-light text-foreground">Товар доступен к заказу и синхронизирован с корзиной магазина</span>
        </div>

        {product.sizes.length > 0 ? (
          <div className="space-y-3">
            <span className="text-sm font-light text-foreground">Размер</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant={selectedSize === size ? "default" : "outline"}
                  className="h-10 min-w-12 rounded-full px-4"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-light text-foreground">Количество</span>
          <div className="flex items-center rounded-full border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrementQuantity}
              className="h-10 w-10 p-0 hover:bg-muted/50 rounded-none border-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="h-10 flex items-center px-4 text-sm font-light min-w-12 justify-center border-x border-border bg-background">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={incrementQuantity}
              className="h-10 w-10 p-0 hover:bg-muted/50 rounded-none border-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={adding}
            className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
          >
            {adding ? "Добавление..." : "Добавить в корзину"}
          </Button>
          <Link
            to="/fitting-room"
            state={{ product }}
            className="h-12 px-6 rounded-full inline-flex items-center justify-center font-light text-sm border border-foreground/20 text-foreground bg-background hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Примерить
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
