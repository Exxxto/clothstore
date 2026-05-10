import { SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface FilterSortBarProps {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  itemCount: number;
  sortBy: string;
  setSortBy: (value: string) => void;
  priceFrom: string;
  setPriceFrom: (value: string) => void;
  priceTo: string;
  setPriceTo: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const FilterSortBar = ({
  filtersOpen,
  setFiltersOpen,
  itemCount,
  sortBy,
  setSortBy,
  priceFrom,
  setPriceFrom,
  priceTo,
  setPriceTo,
  onApplyFilters,
  onResetFilters,
}: FilterSortBarProps) => {
  const materials = ["Хлопок", "Деним", "Шерсть", "Кожа"];

  return (
    <>
      <section className="w-full mb-6 pb-4 border-b border-border/70">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles size={13} strokeWidth={1.75} />
              Каталог
            </div>
            <p className="text-sm font-light text-muted-foreground">
              {itemCount} товаров
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-light rounded-full border border-border bg-background/80 px-4 hover:bg-foreground hover:text-background transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Фильтры
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(92vw,26rem)] border-l border-border/70 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.98),rgba(247,247,245,1))] shadow-[0_24px_80px_rgba(0,0,0,0.16)] p-0">
                <div className="flex h-full flex-col">
                  <SheetHeader className="border-b border-border/70 px-6 py-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground w-fit">
                      <Sparkles size={13} strokeWidth={1.75} />
                      Фильтры
                    </div>
                    <SheetTitle className="text-2xl font-light mt-3">Уточните подборку</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      Отсекайте лишнее и держите фокус на нужных товарах.
                    </p>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                        <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground mb-4">Цена</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">
                              От
                            </label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={priceFrom}
                              onChange={(e) => setPriceFrom(e.target.value)}
                              placeholder="0"
                              className="rounded-2xl bg-background/80"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">
                              До
                            </label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={priceTo}
                              onChange={(e) => setPriceTo(e.target.value)}
                              placeholder="10000"
                              className="rounded-2xl bg-background/80"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                        <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground mb-4">Материал</h3>
                        <div className="flex flex-wrap gap-2">
                          {materials.map((material) => (
                            <label
                              key={material}
                              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 cursor-pointer hover:border-foreground/30 hover:bg-muted/40 transition-colors"
                            >
                              <Checkbox id={material} className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
                              <span className="text-sm font-light text-foreground">{material}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/70 px-6 py-5 bg-background/90 backdrop-blur-sm">
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full rounded-full h-11 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                        onClick={onApplyFilters}
                      >
                        Применить фильтры
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-full h-11 border border-border/70 hover:bg-muted/50"
                        onClick={onResetFilters}
                      >
                        Сбросить всё
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto border border-border/70 bg-background/80 text-sm font-light shadow-none rounded-full pr-3 pl-4 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/70 bg-background shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                <SelectItem value="featured" className="hover:bg-muted/60 data-[state=checked]:bg-muted/60">Рекомендуемое</SelectItem>
                <SelectItem value="price-low" className="hover:bg-muted/60 data-[state=checked]:bg-muted/60">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-high" className="hover:bg-muted/60 data-[state=checked]:bg-muted/60">Цена: по убыванию</SelectItem>
                <SelectItem value="newest" className="hover:bg-muted/60 data-[state=checked]:bg-muted/60">Новинки</SelectItem>
                <SelectItem value="name" className="hover:bg-muted/60 data-[state=checked]:bg-muted/60">Название A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </>
  );
};

export default FilterSortBar;
