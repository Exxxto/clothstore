import winston from "winston";
import path from "path";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ─── Форматы ────────────────────────────────────────────────────────────────

/** Однострочный формат для консоли */
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    return `[${timestamp}] ${level}: ${stack ?? message}${metaStr}`;
  })
);

/** JSON-формат для файлов (удобен для парсинга в Grafana/ELK) */
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

// ─── Транспорты ─────────────────────────────────────────────────────────────

const logsDir = path.resolve(process.cwd(), "logs");

const transports: winston.transport[] = [
  // Консоль — всегда
  new winston.transports.Console({ format: consoleFormat }),

  // Все логи уровня info и выше → combined.log
  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
    tailable: true,
  }),

  // Только ошибки → error.log
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
    tailable: true,
  }),
];

// ─── Логгер ─────────────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transports,
  // Не падать при необработанных исключениях — логируем и продолжаем
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), format: fileFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), format: fileFormat }),
  ],
});

export default logger;
