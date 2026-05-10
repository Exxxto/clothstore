import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const MAX_SIZE = 1000;

/** Вырезает область из изображения и возвращает base64 JPEG */
async function cropImageToBase64(
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const size = Math.min(MAX_SIZE, Math.max(pixelCrop.width, pixelCrop.height));
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas context unavailable"));
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size,
      );

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };

    img.onerror = () => reject(new Error("image load failed"));
    img.src = imageSrc;
  });
}

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

export function AvatarCropDialog({
  open,
  imageSrc,
  onConfirm,
  onCancel,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const result = await cropImageToBase64(imageSrc, croppedAreaPixels);
      onConfirm(result);
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-light">Кадрирование фото</DialogTitle>
        </DialogHeader>

        {/* Область кропа */}
        <div className="relative h-80 w-full bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Управление зумом */}
        <div className="flex items-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Уменьшить"
          >
            <ZoomOut size={18} />
          </button>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
            aria-label="Масштаб"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Увеличить"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Сбросить"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2">
          <Button variant="outline" onClick={onCancel} disabled={applying}>
            Отмена
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={applying}>
            {applying ? "Применение..." : "Применить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
