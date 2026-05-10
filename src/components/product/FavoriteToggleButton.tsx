import { Heart } from "lucide-react";

import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteToggleButtonProps {
  productId: number;
  className?: string;
}

const FavoriteToggleButton = ({ productId, className }: FavoriteToggleButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={active}
      title={active ? "Убрать из избранного" : "Добавить в избранное"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(productId);
      }}
      className={[
        "inline-flex items-center justify-center rounded-full border transition-all duration-200",
        "bg-background/92 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm",
        "hover:scale-[1.04] hover:border-foreground/25",
        active
          ? "border-rose-300 text-rose-500"
          : "border-border/70 text-foreground",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Heart size={16} strokeWidth={1.8} className={active ? "fill-current" : ""} />
    </button>
  );
};

export default FavoriteToggleButton;
