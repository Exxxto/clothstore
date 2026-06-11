import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Plus, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, type Product } from "@/data/products";
import { apiGetPublicProducts } from "@/lib/productApi";
import fittingImage from "@/assets/fitting-room-preview.png";

type SlotType = "верх" | "низ" | "обувь";
type AudienceType = "men" | "women" | "kids";

const slotShortLabels: Record<SlotType, string> = {
  "верх": "Верх",
  "низ": "Низ",
  "обувь": "Обувь",
};

const slotBaseLabels: Record<SlotType, string> = {
  "верх": "Верх",
  "низ": "Низ",
  "обувь": "Обувь",
};

const slotLabelsByAudience: Record<AudienceType, Record<SlotType, string>> = {
  men: {
    "верх": "Верх (футболка, свитер, куртка, рубашка, худи)",
    "низ": "Низ (джинсы, брюки)",
    "обувь": "Обувь (кроссовки)",
  },
  women: {
    "верх": "Верх (футболка, свитер, куртка, платье)",
    "низ": "Низ (джинсы, брюки, юбка)",
    "обувь": "Обувь (кроссовки)",
  },
  kids: {
    "верх": "Верх (футболка, свитер, куртка, худи)",
    "низ": "Низ (джинсы, брюки)",
    "обувь": "Обувь (кроссовки)",
  },
};

const typeToSlot: Record<string, SlotType> = {
  tshirts: "верх",
  shirts: "верх",
  sweaters: "верх",
  hoodies: "верх",
  jackets: "верх",
  jeans: "низ",
  pants: "низ",
  skirts: "низ",
  dresses: "верх",
  sneakers: "обувь",
};

const fittingSlots: SlotType[] = ["верх", "низ", "обувь"];

const audienceOptions: Array<{ value: AudienceType; label: string; description: string }> = [
  { value: "men", label: "Мужское", description: "Базовый, повседневный и casual-образ" },
  { value: "women", label: "Женское", description: "Соберите образ для повседневного выхода" },
  { value: "kids", label: "Детское", description: "Подборка вещей для мальчиков и девочек" },
];

const FittingRoom = () => {
  const location = useLocation();
  const incomingProduct = (location.state as { product?: Product } | null)?.product ?? null;

  const getInitialSlots = (): Record<SlotType, Product | null> => {
    const base = { "верх": null, "низ": null, "обувь": null };
    if (incomingProduct) {
      const slot = typeToSlot[incomingProduct.type];
      if (slot) return { ...base, [slot]: incomingProduct };
    }
    return base;
  };

  const getInitialAudience = (): AudienceType | null => {
    if (!incomingProduct) return null;
    const g = incomingProduct.gender;
    if (g === "men" || g === "women" || g === "kids") return g;
    return null;
  };

  const [slots, setSlots] = useState<Record<SlotType, Product | null>>(getInitialSlots);
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<AudienceType | null>(getInitialAudience);

  // Реальные товары из API
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    apiGetPublicProducts()
      .then((rows) => setAllProducts(rows))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const availableProducts = useMemo(() => {
    if (!activeSlot || !selectedAudience) return [];
    return allProducts.filter(
      (p) => typeToSlot[p.type] === activeSlot && p.gender === selectedAudience
    );
  }, [activeSlot, selectedAudience, allProducts]);

  const selectAudience = (audience: AudienceType) => {
    setSelectedAudience(audience);
    setSlots({ "верх": null, "низ": null, "обувь": null });
    setActiveSlot(null);
  };

  const addToSlot = (product: Product) => {
    const slot = typeToSlot[product.type];
    if (slot) {
      setSlots((prev) => ({ ...prev, [slot]: product }));
      setActiveSlot(null);
    }
  };

  const removeFromSlot = (slot: SlotType) => {
    setSlots((prev) => ({ ...prev, [slot]: null }));
  };

  const resetAll = () => {
    setSlots({ "верх": null, "низ": null, "обувь": null });
    setActiveSlot(null);
    setSelectedAudience(null);
  };

  const totalPrice = Object.values(slots)
    .filter(Boolean)
    .reduce((sum, p) => sum + (p?.price || 0), 0);

  const filledProducts = Object.values(slots).filter(Boolean) as Product[];

  const getSlotLabel = (slot: SlotType) => {
    if (selectedAudience) {
      return slotLabelsByAudience[selectedAudience][slot];
    }

    return slotBaseLabels[slot];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.05),transparent_28%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.035),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(248,248,246,1))]" />

        <section className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-3 lg:gap-2">
            <Card className="border-border/70 bg-background/80 shadow-[0_18px_50px_rgba(0,0,0,0.05)] overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 bg-secondary">
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.14),rgba(0,0,0,0.25))]" />
                  <img
                    src={fittingImage}
                    alt="3D-манекен"
                    className="h-[520px] md:h-[640px] w-full object-cover opacity-90"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card className="border-border/70 bg-background/80 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardContent className="p-5 md:p-6">

                  {/* Заголовок + сброс */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                        <Sparkles size={11} strokeWidth={1.75} />
                        Новая функция
                      </div>
                      <h2 className="text-lg md:text-xl font-light text-foreground">Виртуальная примерочная</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedAudience
                          ? "Заполните все три категории, чтобы собрать полный образ."
                          : "Соберите комплект и сразу увидите итоговую стоимость."}
                      </p>
                    </div>
                    <button
                      onClick={resetAll}
                      className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      <RotateCcw size={12} />
                      Сбросить
                    </button>
                  </div>

                  {/* Выбор аудитории */}
                  <div className="mb-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground mb-2">Для кого</p>
                    <div className="grid grid-cols-3 gap-2">
                      {audienceOptions.map((option) => {
                        const isActive = selectedAudience === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => selectAudience(option.value)}
                            className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                              isActive
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background hover:border-foreground hover:bg-muted/30"
                            }`}
                          >
                            <div className="text-xs font-medium">{option.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Слоты */}
                  <div className="space-y-3">
                    {fittingSlots.map((slot) => (
                      <div key={slot} className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {getSlotLabel(slot)}
                        </p>
                        {slots[slot] ? (
                          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                            <img
                              src={slots[slot]!.image}
                              alt={slots[slot]!.name}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{slots[slot]!.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{formatPrice(slots[slot]!.price)}</p>
                            </div>
                            <button
                              onClick={() => removeFromSlot(slot)}
                              className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={!selectedAudience}
                            onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-sm font-light transition-colors ${
                              !selectedAudience
                                ? "cursor-not-allowed border-border/50 text-muted-foreground/50 bg-muted/20"
                                : activeSlot === slot
                                ? "border-foreground text-foreground bg-background"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-background"
                            }`}
                          >
                            <Plus size={14} />
                            {selectedAudience ? "Добавить" : "Выберите для кого"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalPrice > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Итог</span>
                        <span className="text-base font-light text-foreground">{formatPrice(totalPrice)}</span>
                      </div>
                      <button
                        onClick={() => {
                          filledProducts.forEach((p) => {
                            // TODO: добавить в корзину
                          });
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background px-4 py-3 text-sm font-light transition-all hover:bg-foreground/90 active:scale-[0.98]"
                      >
                        <Sparkles size={14} strokeWidth={1.75} />
                        Примерить
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {activeSlot && (
                <Card className="border-border/70 bg-background/80 shadow-[0_18px_50px_rgba(0,0,0,0.05)]">
                <CardContent className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base md:text-lg font-light text-foreground">
                          Выберите {selectedAudience ? slotLabelsByAudience[selectedAudience][activeSlot].toLowerCase() : "категорию"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Доступные позиции для текущего слота.
                      </p>
                      </div>
                      <div className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {loadingProducts ? "..." : `${availableProducts.length} вариантов`}
                      </div>
                    </div>

                    {selectedAudience ? (
                      <div className="grid grid-cols-3 gap-3 max-h-[32rem] overflow-y-auto pr-1">
                        {loadingProducts ? (
                          <div className="col-span-2 py-8 text-center text-sm text-muted-foreground font-light">
                            Загрузка товаров...
                          </div>
                        ) : availableProducts.length === 0 ? (
                          <div className="col-span-2 py-8 text-center text-sm text-muted-foreground font-light">
                            Товары не найдены
                          </div>
                        ) : (
                          availableProducts.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => addToSlot(product)}
                              className="group overflow-hidden rounded-2xl border border-border bg-background text-left transition-all hover:border-foreground hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
                            >
                              <div className="aspect-square overflow-hidden bg-secondary">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                                />
                              </div>
                              <div className="p-3">
                                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                        Выберите аудиторию сверху, чтобы показать подходящие вещи.
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
                      <p className="text-sm text-muted-foreground">Можно заменить выбранную вещь в любой момент.</p>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FittingRoom;
