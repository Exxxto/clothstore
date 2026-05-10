import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_SLUGS } from "@/lib/categoryRoutes";

const Footer = () => {
  return (
    <footer className="w-full bg-background border-t border-border/70 mt-8">
      <div className="w-full px-6 lg:px-10 pt-8 lg:pt-10 pb-4">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-16">

          {/* Brand */}
          <div className="space-y-4">
            <p className="text-2xl font-light tracking-[0.22em] text-foreground">СИЛУЭТ</p>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xs">
              Одежда с чистой линией. Минимализм, качество и стиль для повседневной жизни.
            </p>
          </div>

          {/* Каталог */}
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-5">Каталог</p>
            <ul className="space-y-3">
              {[
                { label: "Мужское", to: `/category/${CATEGORY_SLUGS.men}` },
                { label: "Женское", to: `/category/${CATEGORY_SLUGS.women}` },
                { label: "Детское", to: `/category/${CATEGORY_SLUGS.kids}` },
                { label: "Новинки", to: `/category/${CATEGORY_SLUGS.new}` },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm font-light text-foreground/70 hover:text-foreground transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Покупателям */}
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-5">Покупателям</p>
            <ul className="space-y-3">
              {[
                { label: "Примерочная", to: "/fitting-room" },
                { label: "Жалобы", to: "/complaints" },
                { label: "Доставка", to: "/about/delivery" },
                { label: "Возврат", to: "/about/returns" },
                { label: "Размеры", to: "/about/size-guide" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm font-light text-foreground/70 hover:text-foreground transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Мы в сети */}
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-5">Мы в сети</p>
            <ul className="space-y-3">
              {[
                { label: "Telegram", href: "#" },
                { label: "VK", href: "#" },
                { label: "YouTube", href: "#" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="inline-flex items-center gap-1.5 text-sm font-light text-foreground/70 hover:text-foreground transition-colors duration-150 group"
                  >
                    {label}
                    <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-light text-muted-foreground">
            © 2026 СИЛУЭТ — все права защищены
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-150">
              Конфиденциальность
            </Link>
            <Link to="/terms" className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-150">
              Условия
            </Link>
            <Link to="/account" className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-150">
              Личный кабинет
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
