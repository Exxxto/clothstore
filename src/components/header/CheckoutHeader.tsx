import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const CheckoutHeader = () => {
  return (
    <header className="w-full bg-background border-b border-muted-foreground/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="relative flex items-center justify-between">
          {/* Слева - продолжить покупки */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm font-light hidden sm:inline">Продолжить покупки</span>
          </Link>

          {/* Центр - логотип */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 text-lg font-light tracking-[0.2em] text-foreground">
            СИЛУЭТ
          </Link>

          <div className="flex w-[7rem] justify-end">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default CheckoutHeader;
