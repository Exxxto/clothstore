import { Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSortBarProps {
  itemCount: number;
  sortBy: string;
  setSortBy: (value: string) => void;
}

const FilterSortBar = ({
  itemCount,
  sortBy,
  setSortBy,
}: FilterSortBarProps) => {
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
