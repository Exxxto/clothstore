import swaggerJsdoc from "swagger-jsdoc";

const def: swaggerJsdoc.Options["definition"] = {
  openapi: "3.0.3",
  info: {
    title: "Clothstore API",
    version: "1.0.0",
    description: "REST API интернет-магазина одежды. Роуты с пометкой **Admin** требуют Bearer JWT.",
  },
  servers: [{ url: "http://localhost:3001", description: "Local dev" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string", example: "Ошибка сервера" } },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          type: { type: "string" },
          gender: { type: "string", enum: ["men", "women", "kids"] },
          price: { type: "number" },
          old_price: { type: "number", nullable: true },
          image_url: { type: "string", nullable: true },
          season: { type: "string" },
          category_id: { type: "integer", nullable: true },
          is_new: { type: "boolean" },
          sizes: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          product_id: { type: "integer" },
          product_variant_id: { type: "integer", nullable: true },
          product_name: { type: "string" },
          image_url: { type: "string", nullable: true },
          size: { type: "string", nullable: true },
          unit_price: { type: "number" },
          quantity: { type: "integer" },
        },
      },
      Cart: {
        type: "object",
        properties: {
          id: { type: "integer", nullable: true },
          status: { type: "string" },
          currency: { type: "string", example: "RUB" },
          promo_code: { type: "string", nullable: true },
          items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
          item_count: { type: "integer" },
          subtotal: { type: "number" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "integer" },
          status: { type: "string", enum: ["new", "confirmed", "packing", "shipped", "completed", "cancelled"] },
          total_amount: { type: "number" },
          customer_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          delivery_address: { type: "string" },
          payment_method: { type: "string" },
          payment_status: { type: "string", enum: ["pending", "paid", "failed", "refunded"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      PromoCode: {
        type: "object",
        properties: {
          id: { type: "integer" },
          code: { type: "string" },
          discount_type: { type: "string", enum: ["percent", "fixed"] },
          discount_value: { type: "number" },
          min_order_amount: { type: "number" },
          max_discount_amount: { type: "number", nullable: true },
          usage_limit: { type: "integer", nullable: true },
          usage_count: { type: "integer" },
          is_active: { type: "boolean" },
          starts_at: { type: "string", format: "date-time", nullable: true },
          ends_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      Admin: {
        type: "object",
        properties: {
          id: { type: "integer" },
          last_name: { type: "string" },
          first_name: { type: "string" },
          middle_name: { type: "string", nullable: true },
          username: { type: "string" },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          last_name: { type: "string" },
          first_name: { type: "string" },
          middle_name: { type: "string", nullable: true },
          email: { type: "string" },
          phone: { type: "string", nullable: true },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
          is_active: { type: "boolean" },
          product_count: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Collection: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
          is_active: { type: "boolean" },
          sort_order: { type: "integer" },
          product_count: { type: "integer" },
        },
      },
      Complaint: {
        type: "object",
        properties: {
          id: { type: "integer" },
          requester_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string", nullable: true },
          order_number: { type: "string", nullable: true },
          category: { type: "string" },
          message: { type: "string" },
          status: { type: "string", enum: ["new", "in_review", "resolved", "rejected"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Warehouse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          code: { type: "string" },
          city: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          is_active: { type: "boolean" },
          total_items: { type: "integer" },
        },
      },
      ProductVariant: {
        type: "object",
        properties: {
          id: { type: "integer" },
          product_id: { type: "integer" },
          sku: { type: "string" },
          variant_name: { type: "string" },
          size: { type: "string", nullable: true },
          color: { type: "string", nullable: true },
          price: { type: "number" },
          old_price: { type: "number", nullable: true },
          is_active: { type: "boolean" },
          total_stock: { type: "integer" },
        },
      },
      StockBalance: {
        type: "object",
        properties: {
          id: { type: "integer" },
          warehouse_id: { type: "integer" },
          product_variant_id: { type: "integer" },
          quantity_on_hand: { type: "integer" },
          quantity_reserved: { type: "integer" },
          reorder_point: { type: "integer" },
          warehouse_name: { type: "string" },
          product_name: { type: "string" },
          sku: { type: "string" },
        },
      },
      Address: {
        type: "object",
        properties: {
          id: { type: "integer" },
          label: { type: "string", nullable: true },
          customer_name: { type: "string" },
          email: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          postal_code: { type: "string", nullable: true },
          address_line1: { type: "string" },
          address_line2: { type: "string", nullable: true },
          is_default: { type: "boolean" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Авторизация" },
    { name: "Catalog", description: "Товары (публичные + admin)" },
    { name: "Categories", description: "Категории (Admin)" },
    { name: "Collections", description: "Коллекции (Admin)" },
    { name: "Admins", description: "Управление администраторами (Admin)" },
    { name: "Users", description: "Управление пользователями (Admin)" },
    { name: "Orders", description: "Заказы (Admin)" },
    { name: "Promo Codes", description: "Промокоды (Admin)" },
    { name: "Checkout Methods", description: "Методы доставки и оплаты (Admin)" },
    { name: "Warehouses", description: "Склады (Admin)" },
    { name: "Product Variants", description: "Варианты товаров (Admin)" },
    { name: "Inventory", description: "Остатки и движения (Admin)" },
    { name: "Analytics", description: "Аналитика (Admin)" },
    { name: "Audit Logs", description: "Лог действий (Admin)" },
    { name: "Complaints", description: "Жалобы" },
    { name: "Cart", description: "Корзина (по session_id)" },
    { name: "Wishlist", description: "Список желаний (по session_id)" },
    { name: "Account", description: "Профиль и адреса покупателя (по session_id)" },
    { name: "Checkout", description: "Оформление заказа" },
  ],
  paths: {

    // ── AUTH ──────────────────────────────────────────────────────────────────
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Логин администратора",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "admin123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "JWT токен",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    username: { type: "string" },
                    full_name: { type: "string" },
                    role: { type: "string", example: "admin" },
                  },
                },
              },
            },
          },
          400: { description: "Не переданы логин/пароль" },
          401: { description: "Неверный логин или пароль" },
        },
      },
    },

    // ── CATALOG ───────────────────────────────────────────────────────────────
    "/api/products": {
      get: {
        tags: ["Catalog"],
        summary: "Список товаров",
        parameters: [
          { name: "gender", in: "query", schema: { type: "string", enum: ["men", "women", "kids"] } },
          { name: "type", in: "query", schema: { type: "string" }, description: "Тип товара" },
          { name: "season", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Поиск по name/description" },
        ],
        responses: {
          200: { description: "Массив товаров", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } } },
        },
      },
      post: {
        tags: ["Catalog"],
        summary: "Создать товар (Admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type", "gender", "price", "season"],
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  gender: { type: "string", enum: ["men", "women", "kids"] },
                  price: { type: "number" },
                  old_price: { type: "number" },
                  image_url: { type: "string" },
                  season: { type: "string" },
                  category_id: { type: "integer" },
                  is_new: { type: "boolean" },
                  sizes: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Созданный товар", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          400: { description: "Не заполнены обязательные поля" },
          401: { description: "Требуется авторизация" },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Catalog"],
        summary: "Товар по ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Товар", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          404: { description: "Товар не найден" },
        },
      },
      put: {
        tags: ["Catalog"],
        summary: "Обновить товар (Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type", "gender", "price", "season"],
                properties: {
                  name: { type: "string" }, type: { type: "string" }, gender: { type: "string" },
                  price: { type: "number" }, old_price: { type: "number" }, image_url: { type: "string" },
                  season: { type: "string" }, category_id: { type: "integer" }, is_new: { type: "boolean" },
                  sizes: { type: "array", items: { type: "string" } }, description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Обновлённый товар", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          401: { description: "Требуется авторизация" },
          404: { description: "Товар не найден" },
        },
      },
      delete: {
        tags: ["Catalog"],
        summary: "Удалить товар (Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Товар удалён" },
          401: { description: "Требуется авторизация" },
          404: { description: "Товар не найден" },
        },
      },
    },

    // ── ADMINS ────────────────────────────────────────────────────────────────
    "/api/admins": {
      get: {
        tags: ["Admins"], summary: "Список администраторов (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Массив админов", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Admin" } } } } }, 401: { description: "Требуется авторизация" } },
      },
      post: {
        tags: ["Admins"], summary: "Создать администратора (Admin)", security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["last_name", "first_name", "username", "password"], properties: { last_name: { type: "string" }, first_name: { type: "string" }, middle_name: { type: "string" }, username: { type: "string" }, password: { type: "string", minLength: 6 } } } } },
        },
        responses: { 201: { description: "Созданный админ", content: { "application/json": { schema: { $ref: "#/components/schemas/Admin" } } } }, 400: { description: "Не заполнены обязательные поля" }, 409: { description: "Логин уже занят" } },
      },
    },
    "/api/admins/me": {
      get: {
        tags: ["Admins"], summary: "Текущий администратор (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Данные текущего админа", content: { "application/json": { schema: { $ref: "#/components/schemas/Admin" } } } }, 401: { description: "Требуется авторизация" } },
      },
    },
    "/api/admins/{id}": {
      put: {
        tags: ["Admins"], summary: "Обновить администратора (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["last_name", "first_name", "username"], properties: { last_name: { type: "string" }, first_name: { type: "string" }, middle_name: { type: "string" }, username: { type: "string" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый админ" }, 404: { description: "Админ не найден" }, 409: { description: "Логин уже занят" } },
      },
      delete: {
        tags: ["Admins"], summary: "Удалить администратора (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Админ удалён" }, 400: { description: "Нельзя удалить самого себя" }, 404: { description: "Админ не найден" } },
      },
    },
    "/api/admins/{id}/password": {
      put: {
        tags: ["Admins"], summary: "Сменить пароль администратора (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["password"], properties: { password: { type: "string", minLength: 6 } } } } } },
        responses: { 200: { description: "Пароль обновлён" }, 400: { description: "Пароль слишком короткий" }, 404: { description: "Админ не найден" } },
      },
    },

    // ── USERS ─────────────────────────────────────────────────────────────────
    "/api/users": {
      get: {
        tags: ["Users"], summary: "Список пользователей (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Массив пользователей", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } }, 401: { description: "Требуется авторизация" } },
      },
      post: {
        tags: ["Users"], summary: "Создать пользователя (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["last_name", "first_name", "email", "password"], properties: { last_name: { type: "string" }, first_name: { type: "string" }, middle_name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 6 }, phone: { type: "string" } } } } } },
        responses: { 201: { description: "Созданный пользователь", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, 409: { description: "Email уже зарегистрирован" } },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"], summary: "Пользователь по ID (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Пользователь", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, 404: { description: "Пользователь не найден" } },
      },
      put: {
        tags: ["Users"], summary: "Обновить пользователя (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { last_name: { type: "string" }, first_name: { type: "string" }, middle_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый пользователь" }, 404: { description: "Пользователь не найден" } },
      },
      delete: {
        tags: ["Users"], summary: "Удалить пользователя (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Пользователь удалён" }, 404: { description: "Пользователь не найден" } },
      },
    },
    "/api/users/{id}/password": {
      put: {
        tags: ["Users"], summary: "Сменить пароль пользователя (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["password"], properties: { password: { type: "string", minLength: 6 } } } } } },
        responses: { 200: { description: "Пароль обновлён" }, 400: { description: "Пароль слишком короткий" }, 404: { description: "Пользователь не найден" } },
      },
    },

    // ── CATEGORIES ────────────────────────────────────────────────────────────
    "/api/categories": {
      get: {
        tags: ["Categories"], summary: "Список категорий (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Массив категорий", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Category" } } } } } },
      },
      post: {
        tags: ["Categories"], summary: "Создать категорию (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, is_active: { type: "boolean" } } } } } },
        responses: { 201: { description: "Созданная категория" }, 409: { description: "Название или slug уже заняты" } },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Categories"], summary: "Категория по ID (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Категория", content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } }, 404: { description: "Категория не найдена" } },
      },
      put: {
        tags: ["Categories"], summary: "Обновить категорию (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённая категория" }, 404: { description: "Категория не найдена" } },
      },
      delete: {
        tags: ["Categories"], summary: "Удалить категорию (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Категория удалена" }, 404: { description: "Категория не найдена" } },
      },
    },

    // ── COLLECTIONS ───────────────────────────────────────────────────────────
    "/api/collections": {
      get: {
        tags: ["Collections"], summary: "Список коллекций (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Массив коллекций", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Collection" } } } } } },
      },
      post: {
        tags: ["Collections"], summary: "Создать коллекцию (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, is_active: { type: "boolean" }, sort_order: { type: "integer" } } } } } },
        responses: { 201: { description: "Созданная коллекция" }, 409: { description: "Название или slug уже заняты" } },
      },
    },
    "/api/collections/{id}": {
      put: {
        tags: ["Collections"], summary: "Обновить коллекцию (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, is_active: { type: "boolean" }, sort_order: { type: "integer" } } } } } },
        responses: { 200: { description: "Обновлённая коллекция" }, 404: { description: "Коллекция не найдена" } },
      },
      delete: {
        tags: ["Collections"], summary: "Удалить коллекцию (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Коллекция удалена" }, 404: { description: "Коллекция не найдена" } },
      },
    },

    // ── ORDERS ────────────────────────────────────────────────────────────────
    "/api/orders": {
      get: {
        tags: ["Orders"], summary: "Список заказов (Admin)", security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Фильтр по статусу" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Поиск по имени, email, телефону" },
          { name: "limit", in: "query", schema: { type: "integer", default: 100, maximum: 500 } },
        ],
        responses: { 200: { description: "Массив заказов", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } } }, 401: { description: "Требуется авторизация" } },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"], summary: "Заказ по ID с позициями (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Заказ + items[]" }, 404: { description: "Заказ не найден" } },
      },
    },
    "/api/orders/{id}/status": {
      put: {
        tags: ["Orders"], summary: "Обновить статус заказа (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["new", "confirmed", "packing", "shipped", "completed", "cancelled"] } } } } } },
        responses: { 200: { description: "Обновлённый статус" }, 400: { description: "Некорректный статус" }, 404: { description: "Заказ не найден" } },
      },
    },
    "/api/orders/{id}/payment": {
      put: {
        tags: ["Orders"], summary: "Обновить статус оплаты (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["payment_status"], properties: { payment_status: { type: "string", enum: ["pending", "paid", "failed", "refunded"] }, payment_provider: { type: "string" }, payment_reference: { type: "string" } } } } } },
        responses: { 200: { description: "Обновлённый статус оплаты" }, 400: { description: "Некорректный статус оплаты" }, 404: { description: "Заказ не найден" } },
      },
    },
    "/api/orders/{id}/fulfillment": {
      put: {
        tags: ["Orders"], summary: "Обновить данные отправки (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { carrier: { type: "string" }, tracking_number: { type: "string" }, shipped_at: { type: "string", format: "date-time" } } } } } },
        responses: { 200: { description: "Обновлённые данные отправки" }, 404: { description: "Заказ не найден" } },
      },
    },

    // ── PROMO CODES ───────────────────────────────────────────────────────────
    "/api/promo-codes": {
      get: {
        tags: ["Promo Codes"], summary: "Список промокодов (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Массив промокодов", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/PromoCode" } } } } } },
      },
      post: {
        tags: ["Promo Codes"], summary: "Создать промокод (Admin)", security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["code", "discount_type", "discount_value"], properties: { code: { type: "string", example: "SUMMER20" }, description: { type: "string" }, discount_type: { type: "string", enum: ["percent", "fixed"] }, discount_value: { type: "number" }, min_order_amount: { type: "number", default: 0 }, max_discount_amount: { type: "number" }, starts_at: { type: "string", format: "date-time" }, ends_at: { type: "string", format: "date-time" }, usage_limit: { type: "integer" }, is_active: { type: "boolean", default: true } } } } },
        },
        responses: { 201: { description: "Созданный промокод", content: { "application/json": { schema: { $ref: "#/components/schemas/PromoCode" } } } }, 409: { description: "Промокод уже существует" } },
      },
    },
    "/api/promo-codes/{id}": {
      put: {
        tags: ["Promo Codes"], summary: "Обновить промокод (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "discount_type", "discount_value"], properties: { code: { type: "string" }, discount_type: { type: "string", enum: ["percent", "fixed"] }, discount_value: { type: "number" }, min_order_amount: { type: "number" }, max_discount_amount: { type: "number" }, starts_at: { type: "string", format: "date-time" }, ends_at: { type: "string", format: "date-time" }, usage_limit: { type: "integer" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый промокод" }, 404: { description: "Промокод не найден" }, 409: { description: "Промокод уже существует" } },
      },
      delete: {
        tags: ["Promo Codes"], summary: "Удалить промокод (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Промокод удалён" }, 404: { description: "Промокод не найден" } },
      },
    },

    // ── COMPLAINTS ────────────────────────────────────────────────────────────
    "/api/complaints": {
      post: {
        tags: ["Complaints"], summary: "Отправить жалобу (публичный)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["requester_name", "email", "category", "message"], properties: { requester_name: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string" }, order_number: { type: "string" }, category: { type: "string" }, message: { type: "string" } } } } } },
        responses: { 201: { description: "Жалоба создана", content: { "application/json": { schema: { $ref: "#/components/schemas/Complaint" } } } }, 400: { description: "Не заполнены обязательные поля" } },
      },
      get: {
        tags: ["Complaints"], summary: "Список жалоб (Admin)", security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["new", "in_review", "resolved", "rejected"] } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 100, maximum: 500 } },
        ],
        responses: { 200: { description: "Массив жалоб", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Complaint" } } } } } },
      },
    },
    "/api/complaints/{id}": {
      get: {
        tags: ["Complaints"], summary: "Жалоба по ID (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Жалоба", content: { "application/json": { schema: { $ref: "#/components/schemas/Complaint" } } } }, 404: { description: "Жалоба не найдена" } },
      },
    },
    "/api/complaints/{id}/status": {
      put: {
        tags: ["Complaints"], summary: "Обновить статус жалобы (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["new", "in_review", "resolved", "rejected"] } } } } } },
        responses: { 200: { description: "Обновлённый статус" }, 400: { description: "Некорректный статус" }, 404: { description: "Жалоба не найдена" } },
      },
    },

    // ── AUDIT LOGS ────────────────────────────────────────────────────────────
    "/api/audit-logs": {
      get: {
        tags: ["Audit Logs"], summary: "Лог действий (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } }],
        responses: {
          200: {
            description: "Массив записей лога",
            content: { "application/json": { schema: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, action: { type: "string" }, entity_type: { type: "string" }, entity_id: { type: "integer" }, details: { type: "object" }, ip_address: { type: "string" }, created_at: { type: "string", format: "date-time" }, admin_username: { type: "string" } } } } } },
          },
        },
      },
    },
    "/api/audit-logs/{id}": {
      get: {
        tags: ["Audit Logs"], summary: "Запись лога по ID (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Запись лога" }, 404: { description: "Запись не найдена" } },
      },
    },

    // ── ANALYTICS ─────────────────────────────────────────────────────────────
    "/api/analytics": {
      get: {
        tags: ["Analytics"], summary: "Сводная аналитика (Admin)", security: [{ bearerAuth: [] }],
        parameters: [
          { name: "gender", in: "query", schema: { type: "string", enum: ["all", "men", "women", "kids"] }, description: "Фильтр по полу" },
          { name: "limit", in: "query", schema: { type: "integer", default: 500, maximum: 500 }, description: "Макс. заказов для анализа" },
        ],
        responses: {
          200: {
            description: "Аналитические данные",
            content: { "application/json": { schema: { type: "object", properties: { selectedGender: { type: "string" }, selectedMetrics: { type: "object", properties: { totalRevenue: { type: "number" }, ordersCount: { type: "integer" }, averageOrderValue: { type: "number" }, activeOrders: { type: "integer" }, completedOrders: { type: "integer" }, fulfillmentRate: { type: "number" }, revenueByDay: { type: "array", items: { type: "object" } }, orderStatuses: { type: "array", items: { type: "object" } }, topTypes: { type: "array", items: { type: "object" } } } }, complaints: { type: "object" } } } } },
          },
          401: { description: "Требуется авторизация" },
        },
      },
    },

    // ── WAREHOUSES ────────────────────────────────────────────────────────────
    "/api/warehouses": {
      get: {
        tags: ["Warehouses"], summary: "Список складов (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Массив складов", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Warehouse" } } } } } },
      },
      post: {
        tags: ["Warehouses"], summary: "Создать склад (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, code: { type: "string" }, city: { type: "string" }, address: { type: "string" }, is_active: { type: "boolean" } } } } } },
        responses: { 201: { description: "Созданный склад", content: { "application/json": { schema: { $ref: "#/components/schemas/Warehouse" } } } }, 409: { description: "Название или код уже заняты" } },
      },
    },
    "/api/warehouses/{id}": {
      put: {
        tags: ["Warehouses"], summary: "Обновить склад (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, code: { type: "string" }, city: { type: "string" }, address: { type: "string" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый склад" }, 404: { description: "Склад не найден" } },
      },
      delete: {
        tags: ["Warehouses"], summary: "Удалить склад (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Склад удалён" }, 404: { description: "Склад не найден" } },
      },
    },

    // ── CHECKOUT METHODS ──────────────────────────────────────────────────────
    "/api/checkout-methods": {
      get: {
        tags: ["Checkout Methods"], summary: "Все методы доставки и оплаты (Admin)", security: [{ bearerAuth: [] }],
        responses: { 200: { description: "shipping_methods[] + payment_methods[]", content: { "application/json": { schema: { type: "object", properties: { shipping_methods: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, code: { type: "string" }, name: { type: "string" }, price: { type: "number" }, is_active: { type: "boolean" } } } }, payment_methods: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, code: { type: "string" }, name: { type: "string" }, requires_card: { type: "boolean" }, is_active: { type: "boolean" } } } } } } } } } },
      },
    },
    "/api/checkout-methods/shipping": {
      post: {
        tags: ["Checkout Methods"], summary: "Создать метод доставки (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "name"], properties: { code: { type: "string" }, name: { type: "string" }, description: { type: "string" }, price: { type: "number", default: 0 }, sort_order: { type: "integer", default: 0 }, is_active: { type: "boolean", default: true } } } } } },
        responses: { 201: { description: "Созданный метод доставки" }, 409: { description: "Код уже занят" } },
      },
    },
    "/api/checkout-methods/shipping/{id}": {
      put: {
        tags: ["Checkout Methods"], summary: "Обновить метод доставки (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "name"], properties: { code: { type: "string" }, name: { type: "string" }, description: { type: "string" }, price: { type: "number" }, sort_order: { type: "integer" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый метод доставки" }, 404: { description: "Не найден" } },
      },
      delete: {
        tags: ["Checkout Methods"], summary: "Удалить метод доставки (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Удалён" }, 404: { description: "Не найден" } },
      },
    },
    "/api/checkout-methods/payment": {
      post: {
        tags: ["Checkout Methods"], summary: "Создать метод оплаты (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "name"], properties: { code: { type: "string" }, name: { type: "string" }, description: { type: "string" }, requires_card: { type: "boolean", default: false }, sort_order: { type: "integer", default: 0 }, is_active: { type: "boolean", default: true } } } } } },
        responses: { 201: { description: "Созданный метод оплаты" }, 409: { description: "Код уже занят" } },
      },
    },
    "/api/checkout-methods/payment/{id}": {
      put: {
        tags: ["Checkout Methods"], summary: "Обновить метод оплаты (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "name"], properties: { code: { type: "string" }, name: { type: "string" }, description: { type: "string" }, requires_card: { type: "boolean" }, sort_order: { type: "integer" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый метод оплаты" }, 404: { description: "Не найден" } },
      },
      delete: {
        tags: ["Checkout Methods"], summary: "Удалить метод оплаты (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Удалён" }, 404: { description: "Не найден" } },
      },
    },

    // ── PRODUCT VARIANTS ──────────────────────────────────────────────────────
    "/api/product-variants": {
      get: {
        tags: ["Product Variants"], summary: "Список вариантов товаров (Admin)", security: [{ bearerAuth: [] }],
        parameters: [
          { name: "product_id", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "active", in: "query", schema: { type: "string", enum: ["true", "false", "all"] } },
        ],
        responses: { 200: { description: "Массив вариантов", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ProductVariant" } } } } } },
      },
      post: {
        tags: ["Product Variants"], summary: "Создать вариант товара (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["product_id", "price"], properties: { product_id: { type: "integer" }, variant_name: { type: "string" }, sku: { type: "string" }, size: { type: "string" }, color: { type: "string" }, barcode: { type: "string" }, price: { type: "number" }, old_price: { type: "number" }, cost_price: { type: "number" }, stock_tracking: { type: "boolean" }, is_active: { type: "boolean" }, attributes: { type: "object" } } } } } },
        responses: { 201: { description: "Созданный вариант" }, 404: { description: "Товар не найден" }, 409: { description: "SKU уже используется" } },
      },
    },
    "/api/product-variants/{id}": {
      get: {
        tags: ["Product Variants"], summary: "Вариант по ID с остатками (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Вариант + balances[]" }, 404: { description: "Вариант не найден" } },
      },
      put: {
        tags: ["Product Variants"], summary: "Обновить вариант (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { variant_name: { type: "string" }, sku: { type: "string" }, size: { type: "string" }, color: { type: "string" }, price: { type: "number" }, old_price: { type: "number" }, cost_price: { type: "number" }, is_active: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый вариант" }, 404: { description: "Вариант не найден" }, 409: { description: "SKU уже используется" } },
      },
      delete: {
        tags: ["Product Variants"], summary: "Деактивировать вариант (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Вариант деактивирован" }, 404: { description: "Вариант не найден" } },
      },
    },

    // ── INVENTORY ─────────────────────────────────────────────────────────────
    "/api/inventory": {
      get: {
        tags: ["Inventory"], summary: "Остатки на складах (Admin)", security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "warehouse_id", in: "query", schema: { type: "integer" } },
          { name: "low_stock", in: "query", schema: { type: "boolean" }, description: "Только позиции ниже reorder_point" },
        ],
        responses: { 200: { description: "Массив остатков", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/StockBalance" } } } } } },
      },
    },
    "/api/inventory/movements": {
      get: {
        tags: ["Inventory"], summary: "История движений (Admin)", security: [{ bearerAuth: [] }],
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 100, maximum: 300 } }],
        responses: { 200: { description: "Массив движений" } },
      },
      post: {
        tags: ["Inventory"], summary: "Создать движение склада (Admin)", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["warehouse_id", "product_variant_id", "movement_type", "quantity_delta"], properties: { warehouse_id: { type: "integer" }, product_variant_id: { type: "integer" }, movement_type: { type: "string", example: "receipt" }, quantity_delta: { type: "integer", description: "Положительное — приход, отрицательное — списание" }, reason: { type: "string" }, notes: { type: "string" } } } } } },
        responses: { 201: { description: "Обновлённый остаток" }, 400: { description: "Недостаточно остатка или неверные параметры" } },
      },
    },

    // ── CART ──────────────────────────────────────────────────────────────────
    "/api/store/cart": {
      get: {
        tags: ["Cart"], summary: "Получить корзину",
        parameters: [{ name: "session_id", in: "query", required: true, schema: { type: "string" }, description: "UUID сессии покупателя" }],
        responses: { 200: { description: "Корзина", content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } }, 400: { description: "session_id обязателен" } },
      },
    },
    "/api/store/cart/items": {
      post: {
        tags: ["Cart"], summary: "Добавить товар в корзину",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id", "product_id"], properties: { session_id: { type: "string" }, product_id: { type: "integer" }, product_variant_id: { type: "integer" }, size: { type: "string" }, quantity: { type: "integer", default: 1 } } } } } },
        responses: { 201: { description: "Обновлённая корзина", content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } }, 404: { description: "Товар не найден" } },
      },
    },
    "/api/store/cart/items/{itemId}": {
      put: {
        tags: ["Cart"], summary: "Изменить количество позиции (0 = удалить)",
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id", "quantity"], properties: { session_id: { type: "string" }, quantity: { type: "integer" } } } } } },
        responses: { 200: { description: "Обновлённая корзина", content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } } },
      },
      delete: {
        tags: ["Cart"], summary: "Удалить позицию из корзины",
        parameters: [
          { name: "itemId", in: "path", required: true, schema: { type: "integer" } },
          { name: "session_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Обновлённая корзина", content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } } } },
      },
    },

    // ── WISHLIST ──────────────────────────────────────────────────────────────
    "/api/store/wishlist": {
      get: {
        tags: ["Wishlist"], summary: "Список желаний",
        parameters: [{ name: "session_id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Массив элементов вишлиста" } },
      },
    },
    "/api/store/wishlist/items": {
      post: {
        tags: ["Wishlist"], summary: "Добавить товар в вишлист",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id", "product_id"], properties: { session_id: { type: "string" }, product_id: { type: "integer" } } } } } },
        responses: { 201: { description: "Обновлённый вишлист" } },
      },
    },
    "/api/store/wishlist/items/{productId}": {
      delete: {
        tags: ["Wishlist"], summary: "Удалить товар из вишлиста",
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "integer" } },
          { name: "session_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Обновлённый вишлист" } },
      },
    },

    // ── ACCOUNT ───────────────────────────────────────────────────────────────
    "/api/store/account/profile": {
      get: {
        tags: ["Account"], summary: "Профиль + адреса покупателя",
        parameters: [{ name: "session_id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "{ profile, addresses[] }" } },
      },
      put: {
        tags: ["Account"], summary: "Обновить профиль покупателя",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id"], properties: { session_id: { type: "string" }, last_name: { type: "string" }, first_name: { type: "string" }, middle_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, avatar_url: { type: "string" } } } } } },
        responses: { 200: { description: "Обновлённый профиль" } },
      },
    },
    "/api/store/account/orders": {
      get: {
        tags: ["Account"], summary: "История заказов покупателя",
        parameters: [{ name: "session_id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Массив заказов покупателя" } },
      },
    },
    "/api/store/account/addresses": {
      get: {
        tags: ["Account"], summary: "Адреса покупателя",
        parameters: [{ name: "session_id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Массив адресов", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Address" } } } } } },
      },
      post: {
        tags: ["Account"], summary: "Добавить адрес",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id", "customer_name", "address_line1", "city", "country"], properties: { session_id: { type: "string" }, label: { type: "string" }, customer_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, country: { type: "string" }, city: { type: "string" }, postal_code: { type: "string" }, address_line1: { type: "string" }, address_line2: { type: "string" }, is_default: { type: "boolean" } } } } } },
        responses: { 201: { description: "Обновлённый список адресов" } },
      },
    },
    "/api/store/account/addresses/{addressId}": {
      put: {
        tags: ["Account"], summary: "Обновить адрес",
        parameters: [{ name: "addressId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id", "customer_name", "address_line1", "city", "country"], properties: { session_id: { type: "string" }, label: { type: "string" }, customer_name: { type: "string" }, country: { type: "string" }, city: { type: "string" }, address_line1: { type: "string" }, is_default: { type: "boolean" } } } } } },
        responses: { 200: { description: "Обновлённый список адресов" }, 404: { description: "Адрес не найден" } },
      },
      delete: {
        tags: ["Account"], summary: "Удалить адрес",
        parameters: [
          { name: "addressId", in: "path", required: true, schema: { type: "integer" } },
          { name: "session_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Обновлённый список адресов" }, 404: { description: "Адрес не найден" } },
      },
    },
    "/api/store/account/addresses/{addressId}/default": {
      patch: {
        tags: ["Account"], summary: "Сделать адрес основным",
        parameters: [{ name: "addressId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["session_id"], properties: { session_id: { type: "string" } } } } } },
        responses: { 200: { description: "Обновлённый список адресов" }, 404: { description: "Адрес не найден" } },
      },
    },

    // ── CHECKOUT ──────────────────────────────────────────────────────────────
    "/api/store/checkout/options": {
      get: {
        tags: ["Checkout"], summary: "Доступные методы доставки и оплаты",
        responses: { 200: { description: "{ shipping_methods[], payment_methods[] }" } },
      },
    },
    "/api/store/promo-codes/validate": {
      post: {
        tags: ["Checkout"], summary: "Проверить промокод",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "subtotal"], properties: { code: { type: "string", example: "SUMMER20" }, subtotal: { type: "number", example: 3990 } } } } } },
        responses: {
          200: { description: "Результат проверки", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" }, error: { type: "string" }, discountAmount: { type: "number" } } } } } },
        },
      },
    },
    "/api/store/checkout": {
      post: {
        tags: ["Checkout"], summary: "Оформить заказ",
        description: "Создаёт заказ из активной корзины. Применяет промокод если указан.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["session_id", "customer_name", "phone", "delivery_address", "payment_method", "shipping_method"], properties: { session_id: { type: "string" }, customer_name: { type: "string", example: "Иванов Иван" }, phone: { type: "string", example: "+79001234567" }, email: { type: "string", format: "email" }, delivery_address: { type: "string" }, payment_method: { type: "string", example: "card" }, shipping_method: { type: "string", example: "courier" }, promo_code: { type: "string" }, comment: { type: "string" } } } } },
        },
        responses: { 201: { description: "Созданный заказ", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } }, 400: { description: "Пустая корзина, неверный промокод и т.д." } },
      },
    },

    // ── HEALTH ────────────────────────────────────────────────────────────────
    "/api/health": {
      get: {
        tags: [],
        summary: "Health check",
        responses: { 200: { description: "ok", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" }, timestamp: { type: "string", format: "date-time" } } } } } } },
      },
    },

  },
};

export const swaggerSpec = swaggerJsdoc({ definition: def, apis: [] });
