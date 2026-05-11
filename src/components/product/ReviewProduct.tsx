import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiGetMyReview, apiSubmitProductReview, type ProductReview } from "@/lib/storeApi";

const CustomStar = ({
  filled,
  onClick,
}: {
  filled: boolean;
  onClick: () => void;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 cursor-pointer transition-colors ${
      filled ? "text-foreground" : "text-muted-foreground/30"
    }`}
    onClick={onClick}
  >
    <path
      fillRule="evenodd"
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
      clipRule="evenodd"
    />
  </svg>
);

type ReviewProductProps = {
  productId: number;
  onReviewSubmitted?: () => void;
};

const ReviewProduct = ({ productId, onReviewSubmitted }: ReviewProductProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Существующий отзыв пользователя
  const [existingReview, setExistingReview] = useState<ProductReview | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Поля формы
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");

  const isEditing = existingReview !== null;

  useEffect(() => {
    setLoadingExisting(true);
    apiGetMyReview(productId)
      .then((review) => setExistingReview(review))
      .catch(() => setExistingReview(null))
      .finally(() => setLoadingExisting(false));
  }, [productId]);

  const openDialog = () => {
    // Если есть существующий отзыв — заполняем форму его данными
    if (existingReview) {
      setRating(existingReview.rating);
      setBody(existingReview.body);
      setAuthorName(existingReview.author_name);
    } else {
      setRating(0);
      setBody("");
      setAuthorName("");
    }
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setSuccess(false);
    }
    setIsOpen(open);
  };

  const handleSubmit = async () => {
    if (rating === 0 || body.trim() === "" || authorName.trim() === "") return;
    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await apiSubmitProductReview(productId, {
        author_name: authorName.trim(),
        rating,
        body: body.trim(),
      });
      setExistingReview(saved);
      setSuccess(true);
      onReviewSubmitted?.();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить отзыв");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel = loadingExisting
    ? "Загрузка..."
    : isEditing
    ? "Редактировать отзыв"
    : "Оставить отзыв";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={openDialog}
          disabled={loadingExisting}
          className="w-full h-12 font-light rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background"
        >
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md !rounded-none" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-light text-xl">
            {isEditing ? "Редактировать отзыв" : "Оставить отзыв"}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center text-sm font-light text-muted-foreground">
            {isEditing ? "Отзыв обновлён. Спасибо!" : "Спасибо за ваш отзыв!"}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-light text-foreground">Ваше имя</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Как вас зовут?"
                className="rounded-none font-light"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-light text-foreground">Оценка</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <CustomStar
                    key={star}
                    filled={star <= rating}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-light text-foreground">Ваш отзыв</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Поделитесь впечатлениями о товаре..."
                className="min-h-24 resize-none rounded-none font-light"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-light">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-12 font-light rounded-none"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  rating === 0 ||
                  body.trim() === "" ||
                  authorName.trim() === ""
                }
                className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none"
              >
                {isSubmitting
                  ? "Сохранение..."
                  : isEditing
                  ? "Сохранить изменения"
                  : "Отправить отзыв"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewProduct;
