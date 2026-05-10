import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewProduct from "./ReviewProduct";
import { genderLabels, seasonLabels, type Product, typeLabels } from "@/data/products";

const CustomStar = ({ filled, className }: { filled: boolean; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={`w-3 h-3 ${filled ? 'text-foreground' : 'text-muted-foreground/30'} ${className}`}
  >
    <path 
      fillRule="evenodd" 
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" 
      clipRule="evenodd" 
    />
  </svg>
);

type ProductDescriptionProps = {
  product: Product;
};

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  return (
    <div className="space-y-0">
      {/* Description */}
      <div className="border-b border-border/70">
        <Button
          variant="ghost"
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} strokeWidth={1.75} className="text-muted-foreground" />
            Описание
          </span>
          {isDescriptionOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isDescriptionOpen && (
          <div className="pb-6 pt-1">
            <p className="text-sm font-light text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="border-b border-border/70">
        <Button
          variant="ghost"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Детали товара</span>
          {isDetailsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isDetailsOpen && (
          <div className="pb-6 pt-1 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-light text-muted-foreground">SKU</span>
              <span className="text-sm font-light text-foreground">SKU-{product.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light text-muted-foreground">Раздел</span>
              <span className="text-sm font-light text-foreground">{genderLabels[product.gender]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light text-muted-foreground">Категория</span>
              <span className="text-sm font-light text-foreground">{typeLabels[product.type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light text-muted-foreground">Сезон</span>
              <span className="text-sm font-light text-foreground">{seasonLabels[product.season]}</span>
            </div>
            {product.sizes.length > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-sm font-light text-muted-foreground">Размеры</span>
                <span className="text-right text-sm font-light text-foreground">{product.sizes.join(", ")}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Care Instructions */}
      <div className="border-b border-border/70">
        <Button
          variant="ghost"
          onClick={() => setIsCareOpen(!isCareOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Уход и чистка</span>
          {isCareOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isCareOpen && (
          <div className="pb-6 pt-1 space-y-4">
            <ul className="space-y-2">
              <li className="text-sm font-light text-muted-foreground">• Стирайте и сушите согласно ярлыку на изделии</li>
              <li className="text-sm font-light text-muted-foreground">• Избегайте агрессивных отбеливателей и длительного замачивания</li>
              <li className="text-sm font-light text-muted-foreground">• Храните вещь в сухом месте, защищая от прямого солнца</li>
              <li className="text-sm font-light text-muted-foreground">• Для верхней одежды и обуви используйте профильный уход</li>
            </ul>
            <p className="text-sm font-light text-muted-foreground">
              Если сомневаетесь в способе ухода, обратитесь в поддержку до первой стирки.
            </p>
          </div>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="border-b border-border/70 lg:mb-16">
        <Button
          variant="ghost"
          onClick={() => setIsReviewsOpen(!isReviewsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <div className="flex items-center gap-3">
            <span>Отзывы клиентов</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <CustomStar
                  key={star}
                  filled={star <= 4.8}
                />
              ))}
              <span className="text-sm font-light text-muted-foreground ml-1">4.8</span>
            </div>
          </div>
          {isReviewsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isReviewsOpen && (
          <div className="pb-6 pt-1 space-y-6">
            {/* Review Product Button */}
            <ReviewProduct />

            {/* Reviews List */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <CustomStar
                        key={star}
                        filled={true}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-light text-muted-foreground">Sarah M.</span>
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  "Absolutely stunning earrings! The quality is exceptional and they go with everything. 
                  The architectural design is so unique and I get compliments every time I wear them."
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <CustomStar
                        key={star}
                        filled={star <= 4}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-light text-muted-foreground">Emma T.</span>
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  "Beautiful craftsmanship and comfortable to wear all day. The gold plating has held up 
                  perfectly after months of regular wear. Highly recommend!"
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <CustomStar
                        key={star}
                        filled={true}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-light text-muted-foreground">Jessica R.</span>
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  "These earrings are a work of art. The minimalist design is elegant and sophisticated. 
                  Perfect weight and the packaging was beautiful too."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;
