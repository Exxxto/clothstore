import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroWomen from "@/assets/hero-women.jpg";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_SLUGS } from "@/lib/categoryRoutes";

const HeroSection = () => {
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
    <section ref={ref} className="w-full px-6 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.58),rgba(0,0,0,0.18),rgba(0,0,0,0.08))]" />
        <img src={heroWomen} alt="Новая коллекция одежды" className="h-[72vh] min-h-[560px] w-full object-cover" />
        <div className="absolute inset-0 flex items-end">
          <div
            className={`w-full p-6 md:p-10 lg:p-12 transition-all duration-700 ease-out ${
              visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-6 blur-sm"
            }`}
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/75">
                <Sparkles size={14} strokeWidth={1.75} />
                Весна / Лето 2026
              </div>
              <h1 className="mt-5 text-4xl md:text-6xl font-light leading-[0.95] text-white" style={{ textWrap: "balance" }}>
                Новая коллекция в спокойной карточной подаче.
              </h1>
              <p className="mt-5 max-w-xl text-sm md:text-base font-light text-white">
                Чистые силуэты, выразительные материалы и мягкая редакционная композиция для главной страницы.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`/category/${CATEGORY_SLUGS.all}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-foreground transition-transform duration-200 hover:scale-[0.98]"
                >
                  Смотреть каталог
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/fitting-room"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-light text-white/90 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  Примерочная
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
