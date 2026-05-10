# API Документация — Clothstore

Сервер: `http://localhost:3001`  
Swagger UI: `http://localhost:3001/api/docs`  
OpenAPI JSON: `http://localhost:3001/api/docs.json`

---

## Авторизация

Большинство admin-роутов требуют JWT-токен в заголовке:

```
Authorization: Bearer <token>
```

Токен получается через `POST /api/auth/login` и живёт **8 часов**.

---

## Роуты

### Auth

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/login` | Логин администратора, возвращает JWT |

**Тело запроса:**
```json
{ "username": "admin", "password": "secret" }
```

**Ответ:**
```json
{ "token": "eyJ...", "username": "admin", "full_name": "Иванов Иван", "role": "admin" }
```

---

### Каталог товаров

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/api/products` | — | Список товаров с фильтрами |
| GET | `/api/products/:id` | — | Товар по ID |
| POST | `/api/products` | Admin | Создать товар |
| PUT | `/api/products/:id` | Admin | Обновить товар |
| DELETE | `/api/products/:id` | Admin | Удалить товар |

**Query-параметры GET `/api/products`:**
- `gender` — `men` / `women` / `kids`
- `type` — тип товара (jackets, jeans, …)
- `season` — сезон (winter, summer, …)
- `search` — поиск по названию и описанию

**Обязательные поля при создании/обновлении:** `name`, `type`, `gender`, `price`, `season`

---

### Корзина

Корзина идентифицируется по `session_id` — UUID, который фронтенд генерирует и хранит локально.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/store/cart?session_id=` | Получить корзину |
| POST | `/api/store/cart/items` | Добавить товар |
| PUT | `/api/store/cart/items/:itemId` | Изменить количество (0 = удалить) |
| DELETE | `/api/store/cart/items/:itemId?session_id=` | Удалить позицию |

**Добавление товара:**
```json
{
  "session_id": "uuid",
  "product_id": 42,
  "size": "M",
  "quantity": 1
}
```

**Ответ** всегда возвращает полную корзину:
```json
{
  "id": 1,
  "currency": "RUB",
  "promo_code": null,
  "items": [...],
  "item_count": 3,
  "subtotal": 5990
}
```

---

### Чекаут

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/store/checkout/methods?session_id=` | Методы доставки и оплаты |
| POST | `/api/store/checkout` | Оформить заказ |

**Оформление заказа:**
```json
{
  "session_id": "uuid",
  "customer_name": "Иванов Иван",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "delivery_address": "Москва, ул. Ленина 1",
  "payment_method": "card",
  "shipping_method": "courier",
  "promo_code": "SUMMER20",
  "comment": "Позвоните за час"
}
```

Если корзина пуста или промокод невалиден — вернёт `400` с описанием ошибки.

---

### Заказы (Admin)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/orders` | Список заказов |
| GET | `/api/orders/:id` | Заказ + позиции |
| PUT | `/api/orders/:id/status` | Сменить статус |
| PUT | `/api/orders/:id/payment` | Обновить статус оплаты |
| PUT | `/api/orders/:id/fulfillment` | Трекинг и отправка |

**Статусы заказа:** `new` → `confirmed` → `packing` → `shipped` → `completed` / `cancelled`

**Статусы оплаты:** `pending`, `paid`, `failed`, `refunded`

**Query-параметры GET `/api/orders`:**
- `status` — фильтр по статусу
- `search` — поиск по имени, email, телефону
- `limit` — макс. 500, по умолчанию 100

---

### Промокоды (Admin)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/promo-codes` | Список промокодов |
| POST | `/api/promo-codes` | Создать промокод |
| PUT | `/api/promo-codes/:id` | Обновить промокод |
| DELETE | `/api/promo-codes/:id` | Удалить промокод |

**Создание промокода:**
```json
{
  "code": "SUMMER20",
  "discount_type": "percent",
  "discount_value": 20,
  "min_order_amount": 1000,
  "max_discount_amount": 500,
  "ends_at": "2026-08-31T23:59:59Z",
  "usage_limit": 100,
  "is_active": true
}
```

`discount_type`: `percent` (скидка в %) или `fixed` (фиксированная сумма в ₽).

---

## Прочие роуты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Проверка работоспособности сервера |
| GET | `/api/categories` | Категории товаров |
| GET | `/api/collections` | Коллекции |
| GET | `/api/store/wishlist?session_id=` | Список желаний |
| GET | `/api/store/account/profile?session_id=` | Профиль покупателя |
| GET | `/api/analytics` | Аналитика (Admin) |
| GET | `/api/audit-logs` | Лог действий (Admin) |
| GET | `/api/inventory` | Остатки на складах (Admin) |

---

## Запуск сервера

```bash
npm run server          # обычный запуск
npm run server:watch    # с hot-reload
```

После запуска Swagger UI доступен по адресу:  
**http://localhost:3001/api/docs**
