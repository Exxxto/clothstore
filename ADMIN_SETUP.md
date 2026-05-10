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
