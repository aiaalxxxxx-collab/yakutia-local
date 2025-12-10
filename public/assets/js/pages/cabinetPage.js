/**
 * cabinetPage.js — Production-ready логика кабинета
 */

// --- КОНФИГУРАЦИЯ ---
const API_URL = 'http://localhost:3000/api'; // Убедись, что Python сервер запущен
let CURRENT_USER = null;
let AUTH_TOKEN = localStorage.getItem('token');

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!AUTH_TOKEN) {
        window.location.href = 'index.html'; // Редирект, если нет токена
        return;
    }

    try {
        await fetchUserInfo();
        setupSidebar();
        setupModal();
        
        // По умолчанию открываем Обзор
        switchView('overview');
    } catch (e) {
        console.error('Auth error', e);
        showToast('Ошибка авторизации. Войдите снова.', 'error');
        // localStorage.removeItem('token');
        // window.location.href = 'index.html';
    }
    
    // Кнопка выхода
    document.getElementById('logout-btn').addEventListener('click', () => {
        if(confirm('Выйти из аккаунта?')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    });
});

// --- API CLIENT (Обертка) ---
async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    const headers = { 'Authorization': `Bearer ${AUTH_TOKEN}` };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const config = { method, headers };
    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, config);
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${res.status}`);
    }
    return res.json();
}

// --- ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ---
async function fetchUserInfo() {
    CURRENT_USER = await apiRequest('/users/me');
    
    // Обновляем UI в сайдбаре
    document.getElementById('user-name-display').textContent = CURRENT_USER.name || CURRENT_USER.email;
    
    const roleMap = { buyer: 'Покупатель', seller: 'Продавец', courier: 'Курьер' };
    document.getElementById('user-role-display').textContent = roleMap[CURRENT_USER.role] || CURRENT_USER.role;
}

// --- ГЕНЕРАЦИЯ МЕНЮ (ПО РОЛЯМ) ---
function setupSidebar() {
    const menu = document.getElementById('sidebar-menu');
    menu.innerHTML = ''; // Очистка

    // Общие пункты
    addMenuItem(menu, 'overview', 'Обзор');

    // Пункты для Продавца
    if (CURRENT_USER.role === 'seller') {
        addMenuItem(menu, 'products', 'Мои товары');
        addMenuItem(menu, 'orders', 'Заказы покупателей');
    }
    
    // Пункты для Покупателя
    if (CURRENT_USER.role === 'buyer') {
        addMenuItem(menu, 'orders', 'Мои покупки');
        addMenuItem(menu, 'favorites', 'Избранное');
    }

    // Обработчик кликов
    menu.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (item) {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            switchView(item.dataset.tab);
        }
    });
}

function addMenuItem(container, tabName, label) {
    const div = document.createElement('div');
    div.className = 'nav-item';
    div.dataset.tab = tabName;
    div.textContent = label;
    container.appendChild(div);
}

// --- ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ ---
async function switchView(viewName) {
    // Скрываем все секции
    document.querySelectorAll('.view-section').forEach(el => el.hidden = true);
    
    // Логика загрузки данных для экрана
    if (viewName === 'overview') {
        document.getElementById('view-overview').hidden = false;
        loadStats();
    } else if (viewName === 'products') {
        document.getElementById('view-products').hidden = false;
        loadSellerProducts();
    } else if (viewName === 'orders') {
        document.getElementById('view-orders').hidden = false;
        loadOrders();
    } else {
        showToast(`Раздел ${viewName} в разработке`, 'warning');
    }
}

// --- ЛОГИКА: ТОВАРЫ (Seller) ---
async function loadSellerProducts() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Загрузка...</td></tr>';

    try {
        // Получаем все товары
        const allProducts = await apiRequest('/products');
        // Фильтруем на клиенте (т.к. у нас простой JSON сервер)
        // В реальном SQL API фильтр был бы на бэкенде
        const myProducts = allProducts.filter(p => p.sellerId === CURRENT_USER.id);

        if (myProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">У вас нет товаров</td></tr>';
            return;
        }

        tbody.innerHTML = myProducts.map(p => `
            <tr>
                <td><img src="${p.imageUrl || 'assets/img/no-photo.png'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                <td>${escapeHtml(p.title)}</td>
                <td><b>${p.price} ₽</b></td>
                <td>${p.category}</td>
                <td>
                    <button class="button button--sm button--secondary" onclick="editProduct(${p.id})">Edit</button>
                    <button class="button button--sm" style="background:#fee2e2; color:#991b1b;" onclick="deleteProduct(${p.id})">Del</button>
                </td>
            </tr>
        `).join('');
        
        // Сохраним список локально для редактирования
        window.loadedProducts = myProducts;

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red">Ошибка: ${e.message}</td></tr>`;
    }
}

// --- МОДАЛЬНОЕ ОКНО И ФОРМЫ ---
const modal = document.getElementById('product-modal');
const form = document.getElementById('product-form');
const preview = document.getElementById('image-preview');

function setupModal() {
    // Открытие "Добавить"
    const addBtn = document.getElementById('btn-add-product');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            form.reset();
            form.elements.id.value = '';
            preview.style.display = 'none';
            document.getElementById('modal-title').textContent = 'Новый товар';
            openModal();
        });
    }

    // Закрытие
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.querySelector('.modal__overlay').addEventListener('click', closeModal);

    // Превью картинки при выборе файла
    document.getElementById('product-file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                preview.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // ОТПРАВКА ФОРМЫ (Самая "мясная" часть)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('modal-save-btn');
        btn.textContent = 'Сохранение...';
        btn.disabled = true;

        try {
            const formData = new FormData(form);
            const productId = formData.get('id');
            const file = document.getElementById('product-file-input').files[0];
            
            let imageUrl = null;
            
            // Если есть уже существующий товар, берем его старую картинку
            if (productId && window.loadedProducts) {
                const oldP = window.loadedProducts.find(p => p.id == productId);
                if (oldP) imageUrl = oldP.imageUrl;
            }

            // 1. Если выбран новый файл — грузим его
            if (file) {
                const uploadData = new FormData();
                uploadData.append('image', file);
                const uploadRes = await apiRequest('/upload', 'POST', uploadData, true); // true = isFormData
                imageUrl = uploadRes.imageUrl;
            }

            // 2. Формируем JSON товара
            const productPayload = {
                title: formData.get('title'),
                price: Number(formData.get('price')),
                category: formData.get('category'),
                desc: formData.get('desc'),
                imageUrl: imageUrl, // Ссылка с сервера или старая
                // Доп поля
                place: 'Якутия', 
                promoted: false
            };

            // 3. Создаем или Обновляем
            if (productId) {
                 await apiRequest(`/products/${productId}`, 'PUT', productPayload);
                 showToast('Товар обновлен');
            } else {
                 await apiRequest('/products', 'POST', productPayload);
                 showToast('Товар создан');
            }

            closeModal();
            loadSellerProducts(); // Перезагрузить таблицу

        } catch (err) {
            console.error(err);
            showToast('Ошибка сохранения: ' + err.message, 'error');
        } finally {
            btn.textContent = 'Сохранить';
            btn.disabled = false;
        }
    });
}

function openModal() {
    modal.hidden = false;
    setTimeout(() => modal.classList.add('modal--open'), 10);
}

function closeModal() {
    modal.classList.remove('modal--open');
    setTimeout(() => modal.hidden = true, 300);
}

// Глобальные функции для кнопок в HTML (Edit/Delete)
window.editProduct = function(id) {
    const product = window.loadedProducts.find(p => p.id === id);
    if (!product) return;

    form.elements.id.value = product.id;
    form.elements.title.value = product.title;
    form.elements.price.value = product.price;
    form.elements.category.value = product.category || 'other';
    form.elements.desc.value = product.desc || '';
    
    if (product.imageUrl) {
        preview.src = product.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('modal-title').textContent = 'Редактирование';
    openModal();
};

window.deleteProduct = async function(id) {
    if(!confirm('Удалить этот товар?')) return;
    try {
        await apiRequest(`/products/${id}`, 'DELETE');
        showToast('Товар удален');
        loadSellerProducts();
    } catch(e) {
        showToast(e.message, 'error');
    }
};

// --- УТИЛИТЫ ---

async function loadStats() {
    const container = document.getElementById('stats-container');
    // В реальном проекте тут был бы запрос /api/stats
    // Мы сымитируем подсчет
    try {
        const products = await apiRequest('/products');
        const myProducts = products.filter(p => p.sellerId === CURRENT_USER.id);
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__value">${myProducts.length}</div>
                <div class="stat-card__label">Активных товаров</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__value">0 ₽</div>
                <div class="stat-card__label">Продажи за месяц</div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = 'Ошибка загрузки статистики';
    }
}

async function loadOrders() {
    const list = document.getElementById('orders-list-container');
    list.innerHTML = 'Загрузка...';
    try {
        const orders = await apiRequest('/orders');
        if(!orders.length) {
            list.innerHTML = '<p style="color:#666">Список заказов пуст.</p>';
            return;
        }
        list.innerHTML = orders.map(o => `
            <div style="background:white; padding:15px; margin-bottom:10px; border:1px solid #eee; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <b>Заказ #${o.id}</b>
                    <span class="badge badge--success">${o.status}</span>
                </div>
                <div>Сумма: <b>${o.total} ₽</b></div>
                <div style="font-size:0.9rem; color:#666">${new Date(o.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = 'Ошибка: ' + e.message;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'error' ? '#ef4444' : '#333';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
