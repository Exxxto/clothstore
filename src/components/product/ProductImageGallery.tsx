import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ImageZoom from "./ImageZoom";

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
};

const ProductImageGallery = ({ images, alt }: ProductImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const productImages = images.length > 0 ? images : ["/placeholder.svg"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const handleImageClick = (index: number) => {
    setZoomInitialIndex(index);
    setIsZoomOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const difference = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(difference) > minSwipeDistance) {
      if (difference > 0) {
        // Swipe left - next image
        nextImage();
      } else {
        // Swipe right - previous image
        prevImage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-muted/20">
          <button
            type="button"
            onClick={prevImage}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Предыдущее изображение"
            disabled={productImages.length <= 1}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={nextImage}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Следующее изображение"
            disabled={productImages.length <= 1}
          >
            <ChevronRight size={18} />
          </button>

          <div
            className="aspect-[4/5] lg:aspect-[5/6] overflow-hidden cursor-pointer group touch-pan-y"
            onClick={() => handleImageClick(currentImageIndex)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={productImages[currentImageIndex]}
              alt={`${alt} — изображение ${currentImageIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] select-none"
            />
          </div>
        </div>

        {productImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {productImages.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentImageIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all ${
                  index === currentImageIndex
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border/70 opacity-70 hover:opacity-100"
                }`}
                aria-label={`Показать изображение ${index + 1}`}
              >
                <img src={image} alt={`${alt} — миниатюра ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-2 lg:hidden">
          {productImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentImageIndex ? "bg-foreground" : "bg-muted"
              }`}
              aria-label={`Перейти к изображению ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Image Zoom Modal */}
      <ImageZoom
        images={productImages}
        initialIndex={zoomInitialIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </div>
  );
};

export default ProductImageGallery;
