// server.js — простой сервер для Yakutia Local

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// путь к файлу с товарами
const DATA_FILE = path.join(__dirname, 'products.json');

// парсим JSON в body
app.use(express.json());

// раздаём статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/products — отдать все товары/объявления
app.get('/api/products', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // файла ещё нет — вернём пустой массив
        return res.json([]);
      }
      console.error('Read error:', err);
      return res.status(500).json({ error: 'read_error' });
    }

    try {
      const products = JSON.parse(data || '[]');
      res.json(products);
    } catch (e) {
      console.error('JSON parse error:', e);
      res.json([]);
    }
  });
});

// POST /api/products — добавить новый товар/объявление
app.post('/api/products', (req, res) => {
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
    popularity
  } = req.body || {};

  if (!title || !price) {
    return res.status(400).json({ error: 'title_and_price_required' });
  }

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    let products = [];
    if (!err && data) {
      try {
        products = JSON.parse(data);
      } catch {
        products = [];
      }
    }

    const product = {
      id: Date.now(),
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
      popularity: popularity || 0
    };

    products.push(product);

    fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), (err2) => {
      if (err2) {
        console.error('Write error:', err2);
        return res.status(500).json({ error: 'write_error' });
      }
      res.status(201).json(product);
    });
  });
});

// запуск сервера
app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});
