/**
 * indexPage.js — Главный контроллер главной страницы
 * Включает: Загрузку товаров, Живой поиск, Корзину, Оформление заказа
 */

const API_URL = 'http://localhost:3000/api'; // Адрес твоего Python сервера
let allProducts = []; // Здесь будем хранить загруженные товары

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Index Page Loaded');
    
    // 1. Инициализация Корзины (Модалка + Кнопки)
    initCartLogic();

    // 2. Загрузка товаров с сервера
    await loadProducts();

    // 3. Инициализация Поиска
    initSearch();

    // 4. Инициализация Фильтров (Кнопка "Применить")
    const filterBtn = document.querySelector('.filter-btn'); // Если есть кнопка фильтра
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
});

// =========================================================
// 1. ЛОГИКА ТОВАРОВ (ЗАГРУЗКА И РЕНДЕР)
// =========================================================

async function loadProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;

    container.innerHTML = '<p style="padding:20px;">Загрузка товаров...</p>';

    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Ошибка сервера');
        
        allProducts = await res.json();
        renderProducts(allProducts);
        
    } catch (e) {
        console.error(e);
        // Если сервер недоступен, выведем заглушку или очистим
        container.innerHTML = '<p style="padding:20px; color:red;">Не удалось загрузить товары. Проверьте запущен ли server.js (main.py)</p>';
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="padding:20px;">Товары не найдены.</p>';
        return;
    }

    // Генерация HTML
    const html = products.map(p => {
        const image = p.imageUrl || 'assets/img/products/demo_placeholder.jpg';
        const oldPriceHtml = p.oldPrice ? `<span class="product-card__old-price">${p.oldPrice} ₽</span>` : '';
        
        return `
        <article class="product-card">
            <div class="product-card__image-wrapper">
                <img src="${image}" alt="${p.title}" class="product-card__image" loading="lazy">
                ${p.isSale ? '<span class="product-card__badge product-card__badge--sale">Sale</span>' : ''}
            </div>
            <div class="product-card__content">
                <div class="product-card__price">
                    <span class="product-card__current-price">${p.price} ₽</span>
                    ${oldPriceHtml}
                </div>
                <h3 class="product-card__title" title="${p.title}">${p.title}</h3>
                <div class="product-card__meta">
                    <span class="product-card__place">📍 ${p.place || 'Якутия'}</span>
                </div>
                <button class="button button--primary product-card__add-btn" onclick="addToCartHandler(${p.id})">
                    В корзину
                </button>
            </div>
        </article>
        `;
    }).join('');

    container.innerHTML = html;
}

// Глобальная функция для кнопки "В корзину" (чтобы работала из HTML строки)
window.addToCartHandler = function(productId) {
    // Используем функцию из cart.js (предполагаем, что она подключена)
    if (typeof addToCart === 'function') {
        addToCart(productId);
        
        // Маленькая анимация или уведомление
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Добавлено';
        btn.classList.add('button--success');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('button--success');
        }, 1000);
        
    } else {
        console.error('Функция addToCart не найдена! Проверьте подключение cart.js');
    }
};

// =========================================================
// 2. ЖИВОЙ ПОИСК
// =========================================================

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allProducts.filter(p => p.title.toLowerCase().includes(query));
            renderProducts(filtered);
        }, 300); // Задержка 300мс
    });
}

function applyFilters() {
    // Простейшая фильтрация по категории (пример)
    const catSelect = document.querySelector('select[name="category"]');
    if (!catSelect) return;
    
    const category = catSelect.value;
    let filtered = allProducts;
    
    if (category && category !== 'Все категории') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    renderProducts(filtered);
}

// =========================================================
// 3. КОРЗИНА (МОДАЛКА + ЗАКАЗ)
// =========================================================

function initCartLogic() {
    const modal = document.getElementById('cart-modal');
    const openBtn = document.getElementById('cart-button'); // Кнопка в шапке
    const closeBtn = document.getElementById('cart-close-x'); // Крестик
    const overlay = document.getElementById('cart-overlay');
    
    // Кнопка "Оформить" внутри корзины
    // Ищем кнопку по классу или ID. Лучше добавь id="cart-checkout-btn" в HTML, но найдем и так
    const checkoutBtn = modal ? modal.querySelector('.button--primary') : null;

    // --- ОТКРЫТИЕ ---
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderCartItemsInModal(); // Отрисовать содержимое
            openCartModal();
        });
    }

    // --- ЗАКРЫТИЕ (Крестик) ---
    if (closeBtn) closeBtn.addEventListener('click', closeCartModal);
    // --- ЗАКРЫТИЕ (Фон) ---
    if (overlay) overlay.addEventListener('click', closeCartModal);

    // --- ОФОРМЛЕНИЕ ЗАКАЗА ---
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', submitOrder);
    }

    // Хелперы открытия/закрытия
    function openCartModal() {
        if (!modal) return;
        modal.hidden = false;
        setTimeout(() => modal.classList.add('modal--open'), 10);
    }

    function closeCartModal() {
        if (!modal) return;
        modal.classList.remove('modal--open');
        setTimeout(() => modal.hidden = true, 300);
    }
}

// Отрисовка товаров ВНУТРИ корзины
function renderCartItemsInModal() {
    const listContainer = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    if (!listContainer) return;

    // Берем данные из localStorage (через cart.js)
    const cartItems = typeof getCartItems === 'function' ? getCartItems() : [];
    
    if (cartItems.length === 0) {
        listContainer.innerHTML = '<p>Корзина пуста</p>';
        if(totalEl) totalEl.textContent = '0';
        return;
    }

    let totalPrice = 0;
    
    // Собираем HTML
    const html = cartItems.map(item => {
        // Находим полную инфу о товаре из загруженных allProducts
        const product = allProducts.find(p => p.id == item.productId);
        if (!product) return ''; // Если товар удален, пропускаем

        const sum = product.price * item.quantity;
        totalPrice += sum;

        return `
        <div class="cart-item" style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
            <div>
                <div style="font-weight:bold;">${product.title}</div>
                <div style="font-size:0.8rem; color:#666;">${item.quantity} шт. x ${product.price} ₽</div>
            </div>
            <div style="font-weight:bold;">${sum} ₽</div>
        </div>
        `;
    }).join('');

    listContainer.innerHTML = html;
    if (totalEl) totalEl.textContent = totalPrice;
}

// ОТПРАВКА ЗАКАЗА НА СЕРВЕР
async function submitOrder() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Пожалуйста, войдите в аккаунт, чтобы оформить заказ.');
        return;
    }

    const cartItems = getCartItems();
    if (cartItems.length === 0) {
        alert('Корзина пуста');
        return;
    }
    
    // Считаем сумму (грубо, лучше на сервере пересчитывать, но для прототипа сойдет)
    let total = 0;
    cartItems.forEach(item => {
        const p = allProducts.find(prod => prod.id == item.productId);
        if(p) total += p.price * item.quantity;
    });

    // Отправка
    try {
        const btn = document.querySelector('#cart-modal .button--primary');
        const oldText = btn.textContent;
        btn.textContent = 'Оформление...';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cartItems,
                total: total
            })
        });

        if (res.ok) {
            alert('Заказ успешно создан! Спасибо.');
            localStorage.removeItem('yakutia_cart'); // Очистить
            
            // Закрыть окно
            const modal = document.getElementById('cart-modal');
            modal.classList.remove('modal--open');
            setTimeout(() => modal.hidden = true, 300);
            
            // Обновить счетчик в шапке (если есть код в cart.js)
            location.reload(); 
        } else {
            const err = await res.json();
            alert('Ошибка: ' + (err.detail || 'Не удалось создать заказ'));
        }
        
        btn.textContent = oldText;
        btn.disabled = false;

    } catch (e) {
        console.error(e);
        alert('Ошибка сети');
    }
}
