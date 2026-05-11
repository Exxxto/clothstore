# Силуэт Admin Panel

## Project Structure

```
├── admin_site/              ← Backend API (Express + PostgreSQL)
│   ├── src/
│   │   ├── db/              ← Database connection & migrations
│   │   │   └── index.ts
│   │   ├── middleware/      ← Auth middleware (JWT)
│   │   │   └── auth.ts
│   │   └── routes/          ← REST API route handlers
│   │       └── products.ts
│   ├── index.ts             ← Server entry point
│   └── tsconfig.json
│
├── src/
│   ├── admin/               ← Admin frontend (React)
│   │   ├── components/      ← Layout, Sidebar, ProductForm
│   │   ├── pages/           ← Login, Dashboard, Products, Create, Edit
│   │   ├── api.ts           ← Typed API client
│   │   └── useAuth.ts       ← JWT auth hook
│   ├── components/          ← Public store components
│   ├── pages/               ← Public store pages
│   └── App.tsx              ← Routes (store + /admin/*)
│
├── .env                     ← Environment variables
└── package.json
```

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ running locally

## 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE siluet;"
```

## 2. Configure environment

Edit `.env` in the project root:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/siluet
JWT_SECRET=change_this_to_a_random_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=3001
```

## 3. Start the backend server

```bash
npm run server
```

The server will:
- Connect to PostgreSQL
- Create the `products` table if it doesn't exist
- Seed 16 initial products if the table is empty
- Listen on `http://localhost:3001`

For development with auto-reload:
```bash
npm run server:watch
```

## 4. Start the frontend

```bash
npm run dev
```

## 5. Access the admin panel

Open: **http://localhost:8080/admin/login**

Default credentials:
- Login: `admin`
- Password: `admin123`

> ⚠️ Change these in `.env` before deploying to production.

## Admin panel routes

| Route | Description |
|-------|-------------|
| `/admin/login` | Login page |
| `/admin` | Dashboard with stats |
| `/admin/products` | All products |
| `/admin/products/men` | Men's products |
| `/admin/products/women` | Women's products |
| `/admin/products/kids` | Kids' products |
| `/admin/products/new` | Create new product |
| `/admin/products/:id/edit` | Edit product |

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login |
| GET | `/api/products` | — | List products (with filters) |
| GET | `/api/products/:id` | — | Get single product |
| POST | `/api/products` | ✅ | Create product |
| PUT | `/api/products/:id` | ✅ | Update product |
| DELETE | `/api/products/:id` | ✅ | Delete product |

---

## Мониторинг и отладка серверной части (продакшен)

### Логирование — Winston + Morgan

Сервер использует **Winston** для структурированного логирования и **Morgan** для HTTP-запросов.

#### Файлы логов

| Файл | Содержимое |
|------|-----------|
| `logs/combined.log` | Все события уровня `info` и выше (JSON) |
| `logs/error.log` | Только ошибки уровня `error` (JSON) + необработанные исключения |

Файлы ротируются автоматически: максимум **10 МБ** на файл, хранится **5 последних** версий.

#### Уровни логирования

| Уровень | Когда используется |
|---------|-------------------|
| `error` | Исключения в route-обработчиках, ошибки БД, падение сервера |
| `warn` | HTTP 4xx ответы |
| `http` | Все входящие HTTP-запросы (через Morgan) |
| `info` | Старт сервера, ключевые события |
| `debug` | Детальная отладка (только в `development`) |

Уровень задаётся переменной окружения:
```env
LOG_LEVEL=info   # production
LOG_LEVEL=debug  # development (по умолчанию если NODE_ENV != production)
```

#### Структура JSON-записи в файле

```json
{
  "level": "error",
  "message": "Route error",
  "error": { "message": "...", "stack": "..." },
  "timestamp": "2026-05-11T10:00:00.000Z"
}
```

---

### Просмотр логов на сервере

```bash
# Последние 100 строк ошибок в реальном времени
tail -f logs/error.log | npx pino-pretty   # если используете pino
tail -f logs/error.log | jq .              # через jq (рекомендуется)

# Только сообщения об ошибках
cat logs/error.log | jq 'select(.level == "error") | {time: .timestamp, msg: .message}'

# Поиск ошибок за конкретный день
grep "2026-05-11" logs/error.log | jq .
```

---

### Переменные окружения для продакшена

Добавьте в `.env` (или в переменные окружения процесса):

```env
NODE_ENV=production
LOG_LEVEL=info
```

При `NODE_ENV=production` консольный вывод остаётся, но уровень по умолчанию поднимается до `info` — `debug`-сообщения не пишутся.

---

### PM2 — управление процессом на сервере

PM2 — рекомендуемый способ запуска Node.js-сервера в продакшене.

```bash
# Установка
npm install -g pm2

# Запуск сервера
pm2 start "npx tsx admin_site/index.ts" --name siluet-api

# Автозапуск при перезагрузке системы
pm2 startup
pm2 save

# Просмотр логов PM2 (stdout + stderr)
pm2 logs siluet-api

# Мониторинг CPU/RAM в реальном времени
pm2 monit

# Перезапуск без даунтайма
pm2 reload siluet-api
```

> PM2 пишет свои логи в `~/.pm2/logs/`. Логи Winston (`logs/error.log`, `logs/combined.log`) пишутся независимо.

---

### Health check

Эндпоинт для мониторинга доступности сервера:

```
GET /api/health
→ { "status": "ok", "timestamp": "2026-05-11T10:00:00.000Z" }
```

Используйте его в:
- **Uptime-мониторингах** (UptimeRobot, Better Uptime, Grafana)
- **Load balancer health checks** (nginx upstream, AWS ALB)
- **Docker HEALTHCHECK**

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:3001/api/health || exit 1
```

---

### Nginx — обратный прокси (рекомендуется)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Фронтенд (статика)
    location / {
        root /var/www/siluet/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

### Типичные проблемы и диагностика

| Симптом | Где смотреть | Что искать |
|---------|-------------|-----------|
| API возвращает 500 | `logs/error.log` | `"message": "Route error"` + стек |
| Сервер не стартует | `pm2 logs siluet-api` | Ошибка подключения к БД |
| Медленные запросы | `logs/combined.log` | `response-time` > 1000ms в Morgan-строках |
| Утечка памяти | `pm2 monit` | Рост RSS без снижения |
| Неожиданный рестарт | `pm2 logs` + `logs/error.log` | `unhandledRejection` / `uncaughtException` |

---

### Структура файлов логирования

```
admin_site/src/
├── lib/
│   └── logger.ts          ← Winston-логгер (singleton)
└── middleware/
    └── httpLogger.ts      ← Morgan → Winston HTTP middleware

logs/                      ← Создаётся автоматически при старте
├── combined.log           ← Все логи (info+)
├── error.log              ← Только ошибки
└── .gitkeep
```
