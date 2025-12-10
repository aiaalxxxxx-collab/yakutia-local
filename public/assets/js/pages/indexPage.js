/**
 * indexPage.js — Главный контроллер
 * Версия: FINAL (Хакатон Edition)
 */

const API_URL = 'http://localhost:3000/api'; // Адрес твоего Python сервера
let allProducts = []; // Кэш товаров

// =========================================================
// ГЛАВНАЯ ТОЧКА ВХОДА (ИНИЦИАЛИЗАЦИЯ)
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App Initialized');
    
    // 1. Инициализация UI Корзины
    initCartLogic();

    // 2. Загрузка данных с сервера (параллельно для скорости)
    await Promise.all([
        loadProducts(),
        loadBrands()
    ]);

    // 3. Инициализация Поиска и Фильтров
    initSearch();
    
    // Кнопка фильтра
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
});

// =========================================================
// 1. ТОВАРЫ (Load & Render)
// =========================================================

async function loadProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;

    container.innerHTML = '<div style="padding:20px; text-align:center">⏳ Загрузка свежих продуктов...</div>';

    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Server Error');
        
        allProducts = await res.json();
        renderProducts(allProducts);
        
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="padding:20px; color:red; text-align:center">Ошибка подключения к серверу.<br>Убедитесь, что запущен uvicorn main:app</div>';
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-list');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Товары не найдены 😔</p>';
        return;
    }

    const html = products.map(p => {
        const image = p.imageUrl || 'assets/img/products/demo_placeholder.jpg';
        // Если есть старая цена, показываем зачеркнутую
        const oldPriceHtml = p.oldPrice ? `<span class="product-card__old-price">${p.oldPrice} ₽</span>` : '';
        // Бейджик
        const badge = p.isSale ? '<span class="product-card__badge product-card__badge--sale">Sale</span>' : '';

        return `
        <article class="product-card">
            <div class="product-card__image-wrapper">
                <img src="${image}" alt="${p.title}" class="product-card__image" loading="lazy">
                ${badge}
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
                
                <div class="product-card__actions">
                    <button class="button button--primary product-card__add-btn" onclick="addToCartHandler(${p.id})">
                        В корзину
                    </button>
                    <!-- Кнопка чата (вызывает функцию из realChat.js) -->
                    <button class="button button--secondary button--sm" onclick="openChatWithSeller(${p.id}, '${p.title}')" title="Написать продавцу">
                        💬
                    </button>
                </div>
            </div>
        </article>
        `;
    }).join('');

    container.innerHTML = html;
}

// =========================================================
// 2. БРЕНДЫ (Крупные поставщики)
// =========================================================

async function loadBrands() {
    const container = document.getElementById('brands-grid');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/brands`);
        const brands = await res.json();
        
        if (!brands || brands.length === 0) {
            container.innerHTML = '<p>Список производителей загружается...</p>';
            return;
        }

        container.innerHTML = brands.map(b => `
            <div class="brand-card">
                <div class="brand-card__icon">🏭</div>
                <h4>${b.name}</h4>
                <p>${b.category || 'Местное производство'}</p>
            </div>
        `).join('');
    } catch (e) {
        console.warn('Бренды не загружены (возможно, нет brands.json)');
        // Не показываем ошибку юзеру, просто оставляем пусто
        if(container) container.innerHTML = '<p class="text-muted">Производители обновляются...</p>';
    }
}

// =========================================================
// 3. ПОИСК И ФИЛЬТРЫ
// =========================================================

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            
            // Фильтрация в памяти (клиентская)
            const filtered = allProducts.filter(p => 
                p.title.toLowerCase().includes(query) || 
                (p.desc && p.desc.toLowerCase().includes(query))
            );
            renderProducts(filtered);
        }, 300); // 300ms debounce
    });
}

function applyFilters() {
    // 1. Категория
    const catSelect = document.querySelector('select[name="category"]');
    // 2. Цена
    const priceFrom = document.querySelector('input[name="price_from"]');
    const priceTo = document.querySelector('input[name="price_to"]');
    
    let filtered = allProducts;

    // Фильтр по категории
    if (catSelect && catSelect.value && catSelect.value !== 'Все категории') {
        const catMap = {
            'Мясо': 'meat', 'Рыба': 'fish', 'Ягоды': 'berries', 'Молочные продукты': 'milk', 'Готовая еда': 'ready'
        };
        // Если в value русское название, мапим, если английское - оставляем
        const targetCat = catMap[catSelect.value] || catSelect.value;
        
        // Упрощенная проверка (если категории в базе 'meat', 'fish' и т.д.)
        filtered = filtered.filter(p => p.category === targetCat || p.category === catSelect.value);
    }

    // Фильтр по цене
    if (priceFrom && priceFrom.value) {
        filtered = filtered.filter(p => p.price >= Number(priceFrom.value));
    }
    if (priceTo && priceTo.value) {
        filtered = filtered.filter(p => p.price <= Number(priceTo.value));
    }

    renderProducts(filtered);
}

// =========================================================
// 4. ЛОГИКА КОРЗИНЫ
// =========================================================

function initCartLogic() {
    const modal = document.getElementById('cart-modal');
    const openBtn = document.getElementById('cart-button'); // Кнопка в шапке
    const closeBtn = document.getElementById('cart-close-x'); // Крестик
    const overlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('cart-checkout-btn') || (modal ? modal.querySelector('.button--primary') : null);

    // Обработчики
    if (openBtn) openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        renderCartItemsInModal();
        openCartModal();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeCartModal);
    if (overlay) overlay.addEventListener('click', closeCartModal);
    if (checkoutBtn) checkoutBtn.addEventListener('click', submitOrder);

    // Функции открытия/закрытия
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

// Отрисовка
function renderCartItemsInModal() {
    const listContainer = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    if (!listContainer) return;

    // Берем из cart.js
    const cartItems = typeof getCartItems === 'function' ? getCartItems() : [];
    
    if (cartItems.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888">Ваша корзина пуста 🛒</div>';
        if(totalEl) totalEl.textContent = '0';
        return;
    }

    let totalPrice = 0;
    
    const html = cartItems.map(item => {
        const product = allProducts.find(p => p.id == item.productId);
        if (!product) return ''; // Товар мог быть удален

        const sum = product.price * item.quantity;
        totalPrice += sum;

        return `
        <div class="cart-item">
            <div class="cart-item__info">
                <div class="cart-item__title">${product.title}</div>
                <div class="cart-item__meta">${item.quantity} шт. × ${product.price} ₽</div>
            </div>
            <div class="cart-item__price">${sum} ₽</div>
        </div>
        `;
    }).join('');

    listContainer.innerHTML = html;
    if (totalEl) totalEl.textContent = totalPrice;
}

// =========================================================
// 5. ОФОРМЛЕНИЕ ЗАКАЗА
// =========================================================

async function submitOrder() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('⚠️ Для оформления заказа нужно войти в аккаунт!');
        // Тут можно вызвать модалку логина
        return;
    }

    const cartItems = getCartItems();
    if (cartItems.length === 0) {
        alert('Корзина пуста');
        return;
    }
    
    // Считаем сумму
    let total = 0;
    cartItems.forEach(item => {
        const p = allProducts.find(prod => prod.id == item.productId);
        if(p) total += p.price * item.quantity;
    });

    const btn = document.querySelector('#cart-modal .button--primary');
    if(btn) {
        btn.textContent = 'Оформляем...';
        btn.disabled = true;
    }

    try {
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
            alert('✅ Заказ успешно оформлен! Продавец свяжется с вами.');
            localStorage.removeItem('yakutia_cart'); // Очистка
            
            // Закрываем модалку
            const modal = document.getElementById('cart-modal');
            modal.classList.remove('modal--open');
            setTimeout(() => modal.hidden = true, 300);
            
            // Перезагрузка для обновления счетчиков
            window.location.reload(); 
        } else {
            const err = await res.json();
            alert('Ошибка заказа: ' + (err.detail || 'Неизвестная ошибка'));
        }

    } catch (e) {
        console.error(e);
        alert('Ошибка сети. Проверьте интернет.');
    } finally {
        if(btn) {
            btn.textContent = 'Оформить заказ';
            btn.disabled = false;
        }
    }
}

// =========================================================
// ХЕЛПЕРЫ
// =========================================================

// Функция для кнопки "В корзину" (глобальная)
window.addToCartHandler = function(productId) {
    if (typeof addToCart === 'function') {
        addToCart(productId);
        
        // Визуальный эффект на кнопке
        const btn = event.target;
        const originalText = btn.textContent;
        
        btn.textContent = '✓ Добавлено';
        btn.style.background = '#22c55e'; // Green
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = ''; // Reset
        }, 1000);
    }
};
