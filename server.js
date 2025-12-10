const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// чтобы Express умел читать JSON из тела запросов
app.use(express.json());

// раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// --------- API товаров ----------

// получить все товары
app.get('/api/products', (req, res) => {
  fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
    if (err) {
      // если файла ещё нет, просто вернуть пустой массив
      return res.json([]);
    }
    try {
      const items = JSON.parse(data || '[]');
      res.json(items);
    } catch (e) {
      res.json([]);
    }
  });
});

// добавить товар из личного кабинета
app.post('/api/products', (req, res) => {
  fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
    let items = [];
    if (!err && data) {
      try {
        items = JSON.parse(data);
      } catch {
        items = [];
      }
    }

    const body = req.body || {};
    const item = {
      id: Date.now(),
      type: 'market',
      title: body.title || '',
      desc: body.desc || '',
      price: Number(body.price || 0),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : '',
      discount: body.discount ? Number(body.discount) : '',
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

    fs.writeFile(PRODUCTS_FILE, JSON.stringify(items, null, 2), (writeErr) => {
      if (writeErr) {
        return res.status(500).json({ ok: false });
      }
      res.json({ ok: true, item });
    });
  });
});

// --------- запуск сервера ----------

app.listen(PORT, () => {
  console.log('Server started on port', PORT);
});
