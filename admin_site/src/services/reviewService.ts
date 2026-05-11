import { AppError } from "../lib/AppError";
import * as repo from "../repositories/reviewRepository";

export async function getProductReviews(productId: number) {
  const [reviews, stats] = await Promise.all([
    repo.findReviewsByProduct(productId),
    repo.getAverageRating(productId),
  ]);
  return { reviews, avg_rating: stats.avg, review_count: stats.count };
}

export async function getMyReview(productId: number, sessionId: string) {
  return repo.findReviewBySession(productId, sessionId);
}

export async function submitReview(productId: number, sessionId: string, body: {
  author_name: string;
  rating: number;
  body: string;
}) {
  // Если отзыв уже есть — обновляем
  const existing = await repo.findReviewBySession(productId, sessionId);
  if (existing) {
    const updated = await repo.updateReview(existing.id, sessionId, {
      author_name: body.author_name.trim(),
      rating: body.rating,
      body: body.body.trim(),
    });
    if (!updated) throw new AppError("Не удалось обновить отзыв", 500);
    return updated;
  }

  return repo.createReview({
    product_id: productId,
    session_id: sessionId,
    author_name: body.author_name.trim(),
    rating: body.rating,
    body: body.body.trim(),
  });
}

export async function listAllReviews(filters: { status?: string; product_id?: number; limit?: number }) {
  return repo.findAllReviews(filters);
}

export async function changeReviewStatus(id: number, status: string) {
  const review = await repo.updateReviewStatus(id, status);
  if (!review) throw new AppError("Отзыв не найден", 404);
  return review;
}

export async function removeReview(id: number) {
  const review = await repo.deleteReview(id);
  if (!review) throw new AppError("Отзыв не найден", 404);
  return review;
}
