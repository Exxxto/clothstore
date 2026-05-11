import morgan from "morgan";
import logger from "../lib/logger";
import { type Request, type Response } from "express";

/**
 * Morgan middleware, который пишет HTTP-запросы через Winston.
 *
 * Формат: :method :url :status :res[content-length] - :response-time ms
 * Уровень: warn для 4xx/5xx, info для остальных.
 */
const httpLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message: string) => {
        // Убираем лишний перенос строки, который добавляет Morgan
        const trimmed = message.trim();
        // Определяем уровень по статус-коду (3-й токен)
        const statusCode = parseInt(trimmed.split(" ")[2] ?? "0", 10);
        if (statusCode >= 500) {
          logger.error(trimmed);
        } else if (statusCode >= 400) {
          logger.warn(trimmed);
        } else {
          logger.http(trimmed);
        }
      },
    },
    // Пропускаем health-check, чтобы не засорять логи
    skip: (_req: Request, res: Response) =>
      _req.url === "/api/health" && res.statusCode < 400,
  }
);

export default httpLogger;
