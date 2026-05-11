/**
 * Доменная ошибка с HTTP-статусом.
 * Сервисы бросают AppError — контроллеры ловят и отдают клиенту.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}
