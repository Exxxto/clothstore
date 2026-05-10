import { Link } from "react-router-dom";
import { JEWELRY_CATEGORY_LINKS } from "@/lib/categoryCatalog";

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {JEWELRY_CATEGORY_LINKS.slice(0, 2).map((item) => (
        <div key={item.slug}>
          <Link to={`/category/${item.slug}`} className="block">
            <div className="w-full aspect-square mb-3 overflow-hidden">
              <img 
                src={item.image} 
                alt={item.label} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-normal text-foreground mb-1">
              {item.label}
            </h3>
            <p className="text-sm font-light text-foreground">
              {item.description}
            </p>
          </div>
        </div>
        ))}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
