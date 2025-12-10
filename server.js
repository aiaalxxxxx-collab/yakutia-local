// server.js — боевой JSON-backend для Yakutia Local
// -----------------------------------------------
// Этот сервер обслуживает:
// - товары (CRUD),
// - пользователей и роли (регистрация/логин),
// - корзину и заказы,
// - избранное,
// - бренды,
// - чаты с продавцом.
// Хранилище — JSON-файлы. В будущем можно заменить на БД без переписывания фронта.

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // для хеширования паролей
const jwt = require('jsonwebtoken'); // для простых токенов авторизации
const multer = require('multer'); // для загрузки картинок товаров

const app = express();
const PORT = process.env.PORT || 3000;

// СЕКРЕТ для JWT (в проде — в env)
const JWT_SECRET = 'yakutia-local-secret';

// Пути к JSON-файлам
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');
const BRANDS_FILE = path.join(DATA_DIR, 'brands.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

// Папка для статики и загрузок
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'assets', 'img', 'products');

// Убеждаемся, что папки существуют
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ JSON
// ------------------------------------

/**
 * Прочитать JSON-файл как массив или объект.
 * @param {string} filePath - Путь к JSON файлу.
 * @returns {Promise<any>} - Данные из файла или []/{}.
 */
function readJson(filePath) {
  return new Promise((resolve) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      // Если файла нет — вернём пустой массив
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve([]);
        }
        console.error('Read error:', err);
        return resolve([]);
      }
      try {
        const parsed = JSON.parse(data || '[]');
        resolve(parsed);
      } catch (e) {
        console.error('JSON parse error:', e);
        resolve([]);
      }
    });
  });
}

/**
 * Записать данные в JSON-файл.
 * @param {string} filePath - Путь к JSON файлу.
 * @param {any} data - Данные для записи.
 * @returns {Promise<void>}
 */
function writeJson(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      (err) => {
        if (err) {
          console.error('Write error:', err);
          return reject(err);
        }
        resolve();
      }
    );
  });
}

// ------------------------------------
// КОНФИГ EXPRESS
// ------------------------------------

// Парсим JSON в body
app.use(express.json());

// Раздаём статические файлы из папки public
app.use(express.static(PUBLIC_DIR));

// Простейший CORS (на случай мобильных тестов)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // при необходимости ограничить домен
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ------------------------------------
// НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ КАРТИНОК
// ------------------------------------

const storage = multer.diskStorage({
  // Куда сохраняем файл
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  // Как называем файл
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // расширение
    const base = path.basename(file.originalname, ext);
    const unique = Date.now();
    cb(null, `${base}-${unique}${ext}`);
  }
});

const upload = multer({ storage });

// ------------------------------------
// МИДЛВАРА АВТОРИЗАЦИИ
// ------------------------------------

/**
 * Извлекает пользователя из JWT-токена в заголовке Authorization.
 * Если токена нет или он невалиден — просто идем дальше как гость.
 */
function authOptional(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      role: payload.role
    };
  } catch {
    req.user = null;
  }
  next();
}

/**
 * Требует, чтобы пользователь был авторизован.
 */
function authRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'auth_required' });
  }
  next();
}

// ------------------------------------
// API: ПОЛЬЗОВАТЕЛИ И РОЛИ
// ------------------------------------
app.use(authOptional);

/**
 * POST /api/auth/register
 * Регистрация пользователя с ролью: buyer, seller, courier.
 * Ожидает: { email, password, name, role }
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email_password_role_required' });
  }

  // Поддерживаем только три роли
  const allowedRoles = ['buyer', 'seller', 'courier'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'invalid_role' });
  }

  const users = await readJson(USERS_FILE);
  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'email_exists' });
  }

  const passwordHash = await bcrypt.hash(password, 8);

  const user = {
    id: Date.now(),
    email,
    name: name || '',
    role,
    passwordHash
  };

  users.push(user);
  await writeJson(USERS_FILE, users);

  // Сразу выдаем токен
  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

/**
 * POST /api/auth/login
 * Логин по email + password.
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email_password_required' });
  }

  const users = await readJson(USERS_FILE);
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

/**
 * GET /api/users/me
 * Получить текущего пользователя по токену.
 */
app.get('/api/users/me', authRequired, async (req, res) => {
  const users = await readJson(USERS_FILE);
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

// ------------------------------------
// API: ТОВАРЫ (PRODUCTS)
// ------------------------------------

/**
 * GET /api/products
 * Получить все товары.
 */
app.get('/api/products', async (req, res) => {
  const products = await readJson(PRODUCTS_FILE);
  res.json(products);
});

/**
 * POST /api/products
 * Создать новый товар (только продавец).
 */
app.post('/api/products', authRequired, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'seller_only' });
  }

  const {
    title,
    price,
    type,
    desc,
    place,
    category,
    oldPrice,
    discount,
    season,
    promoted,
    isSale,
    popularity,
    imageUrl
  } = req.body || {};

  if (!title || !price) {
    return res.status(400).json({ error: 'title_and_price_required' });
  }

  const products = await readJson(PRODUCTS_FILE);

  const product = {
    id: Date.now(),
    sellerId: req.user.id, // привязываем к продавцу
    title,
    price,
    type: type || 'market',
    desc: desc || '',
    place: place || 'Якутия',
    category: category || 'other',
    oldPrice: oldPrice || null,
    discount: discount || null,
    season: season || null,
    promoted: !!promoted,
    isSale: !!isSale,
    popularity: popularity || 0,
    imageUrl: imageUrl || null
  };

  products.push(product);
  await writeJson(PRODUCTS_FILE, products);

  res.status(201).json(product);
});

/**
 * PUT /api/products/:id
 * Обновить товар (только владелец-продавец).
 */
app.put('/api/products/:id', authRequired, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'seller_only' });
  }

  const id = Number(req.params.id);
  const products = await readJson(PRODUCTS_FILE);
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'not_found' });
  }

  const product = products[index];
  if (product.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'not_owner' });
  }

  // Обновляем разрешенные поля
  const allowedFields = [
    'title',
    'price',
    'type',
    'desc',
    'place',
    'category',
    'oldPrice',
    'discount',
    'season',
    'promoted',
    'isSale',
    'popularity',
    'imageUrl'
  ];

  for (const key of allowedFields) {
    if (key in req.body) {
      product[key] = req.body[key];
    }
  }

  products[index] = product;
  await writeJson(PRODUCTS_FILE, products);

  res.json(product);
});

/**
 * DELETE /api/products/:id
 * Удалить товар (только владелец-продавец).
 */
app.delete('/api/products/:id', authRequired, async (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'seller_only' });
  }

  const id = Number(req.params.id);
  const products = await readJson(PRODUCTS_FILE);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'not_found' });
  }
  if (product.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'not_owner' });
  }

  const filtered = products.filter((p) => p.id !== id);
  await writeJson(PRODUCTS_FILE, filtered);

  res.json({ success: true });
});

// ------------------------------------
// API: ЗАГРУЗКА КАРТИНОК ТОВАРОВ
// ------------------------------------

/**
 * POST /api/upload
 * Загрузка картинки товара.
 * Возвращает { imageUrl } — путь, который можно сохранить в продукт.
 */
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'file_required' });
  }

  // Путь, по которому картинка будет доступна с фронта
  const publicPath = `/assets/img/products/${req.file.filename}`;
  res.status(201).json({ imageUrl: publicPath });
});

// ------------------------------------
// API: ИЗБРАННОЕ
// ------------------------------------

/**
 * GET /api/favorites
 * Список id товаров в избранном для текущего пользователя.
 */
app.get('/api/favorites', authRequired, async (req, res) => {
  const favorites = await readJson(FAVORITES_FILE);
  const userFav = favorites.find((f) => f.userId === req.user.id);
  res.json(userFav ? userFav.productIds : []);
});

/**
 * POST /api/favorites
 * Перезаписать список избранных товаров пользователя.
 * Ожидает: { productIds: number[] }
 */
app.post('/api/favorites', authRequired, async (req, res) => {
  const { productIds } = req.body || {};
  const favorites = await readJson(FAVORITES_FILE);

  const index = favorites.findIndex((f) => f.userId === req.user.id);
  if (index === -1) {
    favorites.push({
      userId: req.user.id,
      productIds: Array.isArray(productIds) ? productIds : []
    });
  } else {
    favorites[index].productIds = Array.isArray(productIds)
      ? productIds
      : [];
  }

  await writeJson(FAVORITES_FILE, favorites);
  res.json({ success: true });
});

// ------------------------------------
// API: ЗАКАЗЫ
// ------------------------------------

/**
 * GET /api/orders
 * Если покупатель — его заказы, если продавец — заказы на его товары,
 * если курьер — назначенные ему заказы.
 */
app.get('/api/orders', authRequired, async (req, res) => {
  const orders = await readJson(ORDERS_FILE);
  let filtered = orders;

  if (req.user.role === 'buyer') {
    filtered = orders.filter((o) => o.buyerId === req.user.id);
  } else if (req.user.role === 'seller') {
    filtered = orders.filter((o) => o.sellerId === req.user.id);
  } else if (req.user.role === 'courier') {
    filtered = orders.filter((o) => o.courierId === req.user.id);
  }

  res.json(filtered);
});

/**
 * POST /api/orders
 * Создать новый заказ (покупатель).
 * Ожидает: { items: [{ productId, quantity }], total }
 */
app.post('/api/orders', authRequired, async (req, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ error: 'buyer_only' });
  }

  const { items, total } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'items_required' });
  }

  const products = await readJson(PRODUCTS_FILE);
  const orders = await readJson(ORDERS_FILE);

  // Для простоты считаем, что все товары от одного продавца
  const firstProduct = products.find((p) => p.id === items[0].productId);
  const sellerId = firstProduct ? firstProduct.sellerId : null;

  const order = {
    id: Date.now(),
    buyerId: req.user.id,
    sellerId,
    courierId: null, // позже можно назначать
    items,
    total: total || 0,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  await writeJson(ORDERS_FILE, orders);

  res.status(201).json(order);
});

// ------------------------------------
// API: БРЕНДЫ
// ------------------------------------

/**
 * GET /api/brands
 * Список крупных производителей.
 */
app.get('/api/brands', async (req, res) => {
  const brands = await readJson(BRANDS_FILE);
  res.json(brands);
});

// ------------------------------------
// API: ЧАТЫ
// ------------------------------------

/**
 * GET /api/chats/:productId
 * Получить сообщения чата по товару и текущему пользователю.
 */
app.get('/api/chats/:productId', authRequired, async (req, res) => {
  const productId = Number(req.params.productId);
  const chats = await readJson(CHATS_FILE);
  const thread = chats.find(
    (c) =>
      c.productId === productId &&
      c.userId === req.user.id
  );
  res.json(thread ? thread.messages : []);
});

/**
 * POST /api/chats/:productId
 * Добавить сообщение в чат (покупатель/продавец).
 * Ожидает: { text }
 */
app.post('/api/chats/:productId', authRequired, async (req, res) => {
  const productId = Number(req.params.productId);
  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'text_required' });
  }

  const chats = await readJson(CHATS_FILE);

  let thread = chats.find(
    (c) =>
      c.productId === productId &&
      c.userId === req.user.id
  );
  if (!thread) {
    thread = {
      id: Date.now(),
      productId,
      userId: req.user.id,
      messages: []
    };
    chats.push(thread);
  }

  const message = {
    id: Date.now(),
    authorId: req.user.id,
    text,
    createdAt: new Date().toISOString()
  };

  thread.messages.push(message);
  await writeJson(CHATS_FILE, chats);

  res.status(201).json(message);
});

// ------------------------------------
// ЗАПУСК СЕРВЕРА
// ------------------------------------

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});
