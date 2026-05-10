import founders from "@/assets/founders.png";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
const EditorialSection = () => {
  return <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4 max-w-[630px]">
          <h2 className="text-2xl font-normal text-foreground leading-tight md:text-xl">
            Украшения, рождённые из тени и линии
          </h2>
          <p className="text-sm font-light text-foreground leading-relaxed">Силуэт был рождён из встречи двух умов, увидевших красоту не только в украшении, но и в структуре. С опытом в архитектуре и изобразительном искусстве, основатели верили, что ювелирные украшения могут быть больше, чем декор — они могут быть продолжением пространства, света и линии.

        </p>
          <Link to="/about/our-story" className="inline-flex items-center gap-1 text-sm font-light text-foreground hover:text-foreground/80 transition-colors duration-200">
            <span>Прочитать нашу историю</span>
            <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="order-first md:order-last">
          <div className="w-full aspect-square overflow-hidden">
            <img src={founders} alt="Основатели Силуэт" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>;
};
export default EditorialSection;
