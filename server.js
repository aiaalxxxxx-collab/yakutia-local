const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// получить товары
app.get('/api/products', (req, res) => {
  fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    try {
      const items = JSON.parse(data || '[]');
      res.json(items);
    } catch {
      res.json([]);
    }
  });
});

// добавить товар из кабинета
app.post('/api/products', (req, res) => {
  fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
    let items = [];
    if (!err && data) {
      try { items = JSON.parse(data); } catch { items = []; }
    }
    const body = req.body || {};
    const item = {
      id: Date.now(),
      type: 'market',
      title: body.title || '',
      desc: body.desc || '',
      price: body.price || 0,
      oldPrice: body.oldPrice || '',
      discount: body.discount || '',
      place: body.place || 'Якутия',
      category: body.category || '',
      brand: body.brand || 'Малый бизнес Якутии',
      season: body.season || '',
      promoted: !!body.promoted,
      isSale: !!body.isSale,
      isLocal: true,
      popularity: 1
    };
    items.push(item);
    fs.writeFile(PRODUCTS_FILE, JSON.stringify(items, null, 2), () => {
      res.json({ ok: true, item });
    });
  });
});

// fallback для SPA: главная
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Server started on port', PORT);
});
