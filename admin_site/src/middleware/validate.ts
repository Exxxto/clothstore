import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Express middleware factory для валидации req.body через Zod-схему.
 * При ошибке возвращает 400 с массивом ошибок в поле `errors`.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({ error: errors[0]?.message ?? "Ошибка валидации", errors });
      return;
    }

    // Заменяем req.body на распарсенные (и преобразованные) данные
    req.body = result.data;
    next();
  };
}
