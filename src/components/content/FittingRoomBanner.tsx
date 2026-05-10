import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import fittingImage from "@/assets/fitting-room-preview.png";
import { useEffect, useRef, useState } from "react";

const FittingRoomBanner = () => {
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
        className={`relative overflow-hidden rounded-[2rem] border border-border/70 shadow-[0_22px_60px_rgba(0,0,0,0.12)] transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-5 blur-[2px]"
        }`}
      >
        <div className="aspect-[21/9] md:aspect-[3/1] overflow-hidden">
          <img
            src={fittingImage}
            alt="Виртуальная примерочная"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/30" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/75 backdrop-blur-sm mb-3">
            <Sparkles size={13} strokeWidth={1.75} />
            Новая функция
          </p>
          <h2 className="text-background text-2xl md:text-4xl font-light mb-4">
            Виртуальная примерочная
          </h2>
          <p className="text-background/80 text-sm font-light mb-6 max-w-md">
            Собирайте комплекты и примеряйте одежду на 3D-манекене — прямо в браузере
          </p>
          <Link
            to="/fitting-room"
            className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 text-sm font-light rounded-full hover:bg-background/90 transition-colors active:scale-[0.97] shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
          >
            Примерить
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FittingRoomBanner;
