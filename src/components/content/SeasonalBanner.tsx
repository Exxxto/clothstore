import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import seasonalImage from "@/assets/seasonal-spring.jpg";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_SLUGS } from "@/lib/categoryRoutes";

const SeasonalBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="w-full px-6 py-10">
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-[2rem] border border-border/70 bg-background shadow-[0_18px_50px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[2px]"
        }`}
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={seasonalImage}
            alt="Весенняя коллекция"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-4 max-w-md p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles size={13} strokeWidth={1.75} />
            Сезонная коллекция
          </div>
          <h2 className="text-2xl md:text-3xl font-light text-foreground leading-tight">
            Осень 2026
          </h2>
          <p className="text-sm font-light text-muted-foreground leading-relaxed">
            Лёгкие ткани, природные оттенки и свободный крой — коллекция, созданная для тёплых дней и долгих прогулок.
          </p>
          <Link
            to={`/category/${CATEGORY_SLUGS.spring}`}
            className="inline-flex items-center gap-1.5 text-sm font-light text-foreground hover:text-muted-foreground transition-colors active:scale-[0.97]"
          >
            Смотреть коллекцию
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SeasonalBanner;
