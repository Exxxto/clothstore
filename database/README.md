# Database Setup

Эта папка содержит дамп базы данных для локального развёртывания.

## Файлы

- `dump.sql` — полный дамп БД (схема + данные). Генерируется командой ниже.

## Как создать дамп (для того, кто делится)

```cmd
pg_dump -U postgres -d silhouette -f database\dump.sql
```

Если PostgreSQL не в PATH, укажи полный путь:
```cmd
"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U postgres -d silhouette -f database\dump.sql
```

## Как восстановить БД (для сокомандника)

1. Создай базу данных:
```cmd
psql -U postgres -c "CREATE DATABASE silhouette;"
```

2. Восстанови дамп:
```cmd
psql -U postgres -d silhouette -f database\dump.sql
```

3. Скопируй `.env.example` в `.env`:
```cmd
copy .env.example .env
```

4. Установи зависимости и запусти:
```cmd
npm install
npm run server
npm run dev
```
