import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FEATURED_CATEGORY_CARDS } from "@/lib/categoryCatalog";

const CategoryCards = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="w-full px-6 py-4 md:py-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles size={13} strokeWidth={1.75} />
            Категории
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl font-light text-foreground">Быстрый вход в каталог</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {FEATURED_CATEGORY_CARDS.map((cat, i) => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className={`group relative aspect-[3/4] overflow-hidden block rounded-[1.75rem] border border-border/70 shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition-all duration-700 ease-out ${
              visible
                ? "opacity-100 translate-y-0 blur-0"
                : "opacity-0 translate-y-5 blur-[2px]"
            }`}
            style={{ transitionDelay: visible ? `${i * 100 + 100}ms` : "0ms" }}
          >
            <img
              src={cat.image}
              alt={cat.label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex items-end justify-between gap-4">
                <div className="max-w-[12rem]">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Перейти</p>
                  <h3 className="mt-1 text-lg font-light">{cat.label}</h3>
                  <p className="mt-2 text-sm font-light text-white/75">{cat.description}</p>
                </div>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryCards;
