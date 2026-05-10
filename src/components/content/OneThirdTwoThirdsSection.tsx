import { Link } from "react-router-dom";
import { JEWELRY_CATEGORY_LINKS } from "@/lib/categoryCatalog";

const OneThirdTwoThirdsSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Link to={`/category/${JEWELRY_CATEGORY_LINKS[0].slug}`} className="block">
            <div className="w-full h-[500px] lg:h-[800px] mb-3 overflow-hidden">
              <img 
                src={JEWELRY_CATEGORY_LINKS[0].image} 
                alt={JEWELRY_CATEGORY_LINKS[0].label} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-normal text-foreground mb-1">
              {JEWELRY_CATEGORY_LINKS[0].label}
            </h3>
            <p className="text-sm font-light text-foreground">
              {JEWELRY_CATEGORY_LINKS[0].description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Link to={`/category/${JEWELRY_CATEGORY_LINKS[2].slug}`} className="block">
            <div className="w-full h-[500px] lg:h-[800px] mb-3 overflow-hidden">
              <img 
                src={JEWELRY_CATEGORY_LINKS[2].image} 
                alt={JEWELRY_CATEGORY_LINKS[2].label} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-normal text-foreground mb-1">
              {JEWELRY_CATEGORY_LINKS[2].label}
            </h3>
            <p className="text-sm font-light text-foreground">
              {JEWELRY_CATEGORY_LINKS[2].description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;
