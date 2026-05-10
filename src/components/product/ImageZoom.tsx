import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageZoomProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageZoom = ({ images, initialIndex, isOpen, onClose }: ImageZoomProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть окно"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl">
        <div
          className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white/80">
            <div className="text-xs uppercase tracking-[0.18em]">
              {currentIndex + 1} / {images.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-zinc-700 bg-zinc-900/95 p-0 text-white shadow-lg hover:bg-zinc-800 hover:text-white shrink-0"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative bg-black">
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-zinc-800"
              aria-label="Предыдущее изображение"
              disabled={images.length <= 1}
            >
              <ChevronLeft size={22} strokeWidth={2.5} className="text-white" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-zinc-800"
              aria-label="Следующее изображение"
              disabled={images.length <= 1}
            >
              <ChevronRight size={22} strokeWidth={2.5} className="text-white" />
            </button>

            <div className="flex items-center justify-center px-2">
              <img
                src={images[currentIndex]}
                alt={`Product view ${currentIndex + 1}`}
                className="max-h-[60vh] w-full object-contain"
              />
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-zinc-950 px-4 py-3">
              {images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                    index === currentIndex
                      ? "border-white ring-1 ring-white"
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Показать изображение ${index + 1}`}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageZoom;
