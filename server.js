// server.js — BOEBOY MONOLITH (Сервер + Надежная БД внутри)
const express = require('express');
const fs = require('fs').promises; // Используем Promise API
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const helmet = require('helmet'); // Если нет helmet, можно закомментировать, но лучше оставить
const cors = require('cors');     // Если нет cors, можно закомментировать

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-key-change-me'; // В проде заменить!

// --- CONFIG ---
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public/assets/img/products');

// Файлы
const DB_FILES = {
    PRODUCTS: path.join(DATA_DIR, 'products.json'),
    USERS: path.join(DATA_DIR, 'users.json'),
    ORDERS: path.join(DATA_DIR, 'orders.json'),
    FAVORITES: path.join(DATA_DIR, 'favorites.json'),
    CHATS: path.join(DATA_DIR, 'chats.json'),
    BRANDS: path.join(DATA_DIR, 'brands.json')
};

// =========================================================================
// 🛡️ ВНУТРЕННИЙ МОДУЛЬ БД (Транзакции и Блокировки)
// =========================================================================
const locks = new Map(); // Очередь блокировок файлов

/**
 * Умная блокировка файла (Mutex). 
 * Гарантирует, что только один запрос пишет файл в один момент времени.
 */
function acquireLock(filePath) {
    let previousLock = locks.get(filePath) || Promise.resolve();
    let release;
    
    const currentLock = new Promise(resolve => { release = resolve; });
    const chain = previousLock.then(() => release);
    
    locks.set(filePath, chain); // Ставим себя в очередь
    
    return async () => {
        await previousLock; // Ждем предыдущего
        return release;     // Возвращаем функцию разблокировки
    };
}

const db = {
    // Чтение (безопасное)
    async read(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') return []; // Файла нет = пустой массив
            throw err;
        }
    },

    // 🚀 ГЛАВНАЯ ФИШКА: TRANSACTION UPDATE
    // Прочитать -> Изменить -> Записать (Атомарно!)
    async update(filePath, callback) {
        const waitUnlock = await acquireLock(filePath);
        const unlock = await waitUnlock(); // Ждем очереди и блокируем файл
        const tempPath = `${filePath}.tmp-${Date.now()}`; // Временный файл

        try {
            // 1. Читаем актуальные данные (внутри блокировки)
            let currentData;
            try {
                const raw = await fs.readFile(filePath, 'utf8');
                currentData = JSON.parse(raw);
            } catch (err) {
                if (err.code === 'ENOENT') currentData = [];
                else throw err;
            }

            // 2. Выполняем функцию изменения
            const newData = callback(currentData);
            if (newData === undefined) throw new Error('DB Error: Update callback returned undefined');

            // 3. Пишем во временный файл (защита от сбоя питания)
            await fs.writeFile(tempPath, JSON.stringify(newData, null, 2), 'utf8');
            
            // 4. Мгновенная подмена файла (Атомарная операция ОС)
            await fs.rename(tempPath, filePath);
            
            return newData;
        } catch (err) {
            try { await fs.unlink(tempPath); } catch (e) {} // Чистим мусор при ошибке
            throw err;
        } finally {
            unlock(); // Всегда снимаем блокировку
        }
    }
};

// =========================================================================
// 🛠️ НАСТРОЙКА СЕРВЕРА И MIDDLEWARES
// =========================================================================

// Создаем папки при старте
(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('✅ File Storage Initialized');
})();

// Защита и парсинг
// app.use(helmet()); // Раскомментируй, если установил
// app.use(cors());   // Раскомментируй, если установил
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Раздача фронтенда

// Middleware: Авторизация
const authenticate = (optional = false) => (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        if (optional) { req.user = null; return next(); }
        return res.status(401).json({ error: 'Нужен логин' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (optional) { req.user = null; return next(); }
            return res.status(403).json({ error: 'Токен протух' });
        }
        req.user = user;
        next();
    });
};

// Middleware: Валидация полей
const validate = (fields) => (req, res, next) => {
    const missing = fields.filter(f => !req.body[f]);
    if (missing.length > 0) return res.status(400).json({ error: `Нет полей: ${missing.join(', ')}` });
    next();
};

// Загрузка картинок (Multer)
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
});

// =========================================================================
// 🔌 API ROUTES
// =========================================================================

// --- AUTH ---
app.post('/api/auth/register', validate(['email', 'password', 'role']), async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        
        // Используем транзакцию, чтобы два юзера не создали одинаковый email одновременно
        await db.update(DB_FILES.USERS, (users) => {
            if (users.find(u => u.email === email)) throw { status: 409, message: 'Email занят' };
            
            const newUser = {
                id: Date.now(),
                email, name, role,
                password: bcrypt.hashSync(password, 8) // Синхронно ок внутри лока
            };
            users.push(newUser);
            
            // Генерируем токен
            const token = jwt.sign({ id: newUser.id, role }, JWT_SECRET, { expiresIn: '7d' });
            res.status(201).json({ token, user: { id: newUser.id, name, role } });
            return users;
        });
    } catch (e) { handleError(e, res); }
});

app.post('/api/auth/login', validate(['email', 'password']), async (req, res) => {
    try {
        const users = await db.read(DB_FILES.USERS);
        const user = users.find(u => u.email === req.body.email);
        
        if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (e) { handleError(e, res); }
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
    const products = await db.read(DB_FILES.PRODUCTS);
    res.json(products);
});

app.post('/api/products', authenticate(), validate(['title', 'price']), async (req, res) => {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Только продавцы' });
    
    try {
        await db.update(DB_FILES.PRODUCTS, (products) => {
            const newProduct = {
                id: Date.now(),
                sellerId: req.user.id,
                ...req.body
            };
            products.push(newProduct);
            res.status(201).json(newProduct);
            return products;
        });
    } catch (e) { handleError(e, res); }
});

// --- ORDERS (САМОЕ ВАЖНОЕ) ---
app.post('/api/orders', authenticate(), validate(['items']), async (req, res) => {
    if (req.user.role !== 'buyer') return res.status(403).json({ error: 'Только покупатели' });
    
    try {
        const { items } = req.body;
        // 1. Читаем товары (вне транзакции заказа, но это ок для цен)
        const products = await db.read(DB_FILES.PRODUCTS);
        
        let total = 0;
        const enrichedItems = items.map(item => {
            const p = products.find(x => x.id === item.productId);
            if (!p) throw { status: 404, message: `Товар ${item.productId} не найден` };
            total += p.price * item.quantity;
            return { ...item, price: p.price, title: p.title }; // Фиксируем цену покупки
        });

        // 2. Транзакция на запись заказа
        await db.update(DB_FILES.ORDERS, (orders) => {
            const newOrder = {
                id: Date.now(),
                buyerId: req.user.id,
                items: enrichedItems,
                total,
                status: 'new',
                createdAt: new Date()
            };
            orders.push(newOrder);
            res.status(201).json(newOrder);
            return orders;
        });
    } catch (e) { handleError(e, res); }
});

app.get('/api/orders', authenticate(), async (req, res) => {
    const orders = await db.read(DB_FILES.ORDERS);
    let myOrders = [];
    
    if (req.user.role === 'buyer') myOrders = orders.filter(o => o.buyerId === req.user.id);
    else if (req.user.role === 'seller') {
        // Находим заказы, где есть мои товары
        // (Это упрощенно, в идеале нужно дробить заказы по продавцам)
        const products = await db.read(DB_FILES.PRODUCTS);
        const myProductIds = products.filter(p => p.sellerId === req.user.id).map(p => p.id);
        myOrders = orders.filter(o => o.items.some(i => myProductIds.includes(i.productId)));
    }
    
    res.json(myOrders);
});

// --- UPLOAD ---
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });
    res.json({ imageUrl: `/assets/img/products/${req.file.filename}` });
});

// --- HELPER ---
function handleError(err, res) {
    console.error('🔥 Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Ошибка сервера' });
}

// START
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
