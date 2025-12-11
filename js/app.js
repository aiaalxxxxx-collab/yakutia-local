/**
 * Yakutia Market Core
 * Built with "Vanilla JS Components" pattern (No frameworks, pure speed)
 */

// --- STATE MANAGEMENT (Reactive Store) ---
const createState = (initial) => {
    let state = initial;
    const listeners = new Set();
    return {
        get: () => state,
        set: (update) => {
            state = { ...state, ...update };
            listeners.forEach(fn => fn(state));
        },
        subscribe: (fn) => { listeners.add(fn); fn(state); return () => listeners.delete(fn); }
    };
};

// Global Store
const store = createState({
    user: JSON.parse(localStorage.getItem('user')) || null, // {id, role, name}
    lang: localStorage.getItem('lang') || 'ru',
    page: 'home', // Current Route
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    products: [ // Mock Data (Pseudo DB)
        { id: 1, title: 'Оленина Premium', price: 1200, category: 'meat', sellerId: 101, img: 'https://placehold.co/400x300/cce5ff/001d32?text=Meat' },
        { id: 2, title: 'Чир Подледный', price: 950, category: 'fish', sellerId: 101, img: 'https://placehold.co/400x300/cce5ff/001d32?text=Fish' },
        { id: 3, title: 'Брусника (ведро)', price: 3500, category: 'berry', sellerId: 102, img: 'https://placehold.co/400x300/cce5ff/001d32?text=Berry' },
    ],
    searchQuery: '',
    aiChatOpen: false
});

// Effects
store.subscribe(state => localStorage.setItem('user', JSON.stringify(state.user)));
store.subscribe(state => localStorage.setItem('cart', JSON.stringify(state.cart)));

// --- I18N DICTIONARY ---
const t = (key) => {
    const dict = {
        ru: {
            home: 'Главная', orders: 'Заказы', fav: 'Избранное', profile: 'Профиль',
            search: 'Поиск свежих продуктов...',
            meat: 'Мясо', fish: 'Рыба', berry: 'Ягоды', milk: 'Молоко',
            addToCart: 'В корзину',
            aiHello: 'Привет! Я AI-помощник. Чем помочь?',
            roleBuyer: 'Покупатель', roleSeller: 'Продавец', roleCourier: 'Курьер'
        },
        en: {
            home: 'Home', orders: 'Orders', fav: 'Favorites', profile: 'Profile',
            search: 'Search fresh products...',
            meat: 'Meat', fish: 'Fish', berry: 'Berry', milk: 'Milk',
            addToCart: 'Add to Cart',
            aiHello: 'Hi! I am AI Assistant. How can I help?',
            roleBuyer: 'Buyer', roleSeller: 'Seller', roleCourier: 'Courier'
        },
        sah: {
            home: 'Сүрүн', orders: 'Сакаастар', fav: 'Сөбүлүүр', profile: 'Кабинет',
            search: 'Ас көрдөөһүн...',
            meat: 'Эт', fish: 'Балык', berry: 'Отон', milk: 'Үүт',
            addToCart: 'Корзинаҕа',
            aiHello: 'Дорообо! Мин өйдөөх көмөлөһөөччүбүн.',
            roleBuyer: 'Атыылаһааччы', roleSeller: 'Атыыһыт', roleCourier: 'Таһааччы'
        }
    };
    return dict[store.get().lang][key] || key;
};

// --- COMPONENTS ---

const Icon = (name) => `<span class="material-symbols-rounded">${name}</span>`;

// 1. App Shell
const renderApp = () => {
    const s = store.get();
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <!-- TOP BAR -->
        <header class="top-app-bar">
            <div class="brand" onclick="actions.nav('home')">
                ${Icon('storefront')} YakutiaMarket
            </div>
            <div style="display:flex; gap:8px">
                <button class="btn-icon" onclick="actions.toggleLang()">
                    <span style="font-size:14px; font-weight:bold">${s.lang.toUpperCase()}</span>
                </button>
                ${s.user ? `
                    <button class="btn-icon" onclick="actions.nav('profile')">${Icon('account_circle')}</button>
                ` : `
                    <button class="btn-filled" style="height:32px" onclick="actions.nav('auth')">Login</button>
                `}
                <button class="btn-icon" onclick="actions.nav('cart')">
                    ${Icon('shopping_bag')}
                    ${s.cart.length ? `<span style="position:absolute; top:8px; right:8px; width:8px; height:8px; background:red; border-radius:50%"></span>` : ''}
                </button>
            </div>
        </header>

        <!-- MAIN VIEW PORT -->
        <main id="main-content">
            ${renderRoute(s.page, s)}
        </main>

        <!-- AI FAB -->
        <button class="fab" onclick="actions.toggleAI()">
            ${Icon('smart_toy')}
        </button>

        <!-- BOTTOM NAV (Mobile) -->
        <nav class="nav-bar">
            ${navItem('home', 'home', s.page === 'home')}
            ${navItem('favorite', 'fav', s.page === 'fav')}
            ${navItem('receipt_long', 'orders', s.page === 'orders')}
            ${navItem('person', 'profile', s.page === 'profile')}
        </nav>
    `;

    if (s.aiChatOpen) renderAIModal();
};

const navItem = (icon, page, active) => `
    <div class="nav-item ${active ? 'active' : ''}" onclick="actions.nav('${page}')">
        <div class="icon-box">${Icon(icon)}</div>
        <span>${t(page)}</span>
    </div>
`;

// 2. Router Logic
const renderRoute = (page, s) => {
    switch(page) {
        case 'home': return renderHome(s);
        case 'auth': return renderAuth(s);
        case 'profile': return renderProfile(s);
        case 'cart': return renderCart(s);
        case 'chat': return renderChat(s);
        default: return renderHome(s);
    }
};

// --- PAGES ---

const renderHome = (s) => `
    <div class="search-bar-container">
        <div class="search-bar">
            ${Icon('search')}
            <input type="text" class="search-input" placeholder="${t('search')}" 
                   oninput="actions.search(this.value)" value="${s.searchQuery}">
        </div>
    </div>
    
    <div class="container">
        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:8px">
            <button class="btn btn-tonal">${t('meat')}</button>
            <button class="btn btn-tonal">${t('fish')}</button>
            <button class="btn btn-tonal">${t('berry')}</button>
            <button class="btn btn-tonal">${t('milk')}</button>
        </div>

        <div class="card-grid">
            ${s.products
                .filter(p => p.title.toLowerCase().includes(s.searchQuery.toLowerCase()))
                .map(p => `
                <div class="md-card" onclick="actions.openProduct(${p.id})">
                    <div class="card-media"><img src="${p.img}" loading="lazy"></div>
                    <div class="card-content">
                        <div class="headline">${p.title}</div>
                        <div class="subhead">${t(p.category)}</div>
                        <div class="price-tag">${p.price} ₽</div>
                        <button class="btn-filled" style="margin-top:8px" 
                            onclick="event.stopPropagation(); actions.addToCart(${p.id})">
                            ${t('addToCart')}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
`;

const renderAuth = (s) => `
    <div class="container" style="max-width:400px; margin-top:40px; text-align:center">
        <h2>Welcome</h2>
        <p style="color:var(--md-sys-color-secondary); margin-bottom:24px">Выберите роль для входа</p>
        
        <div style="display:flex; flex-direction:column; gap:16px">
            <button class="btn-filled" style="height:56px" onclick="actions.login('buyer', 'Ivan User')">
                ${Icon('shopping_bag')} &nbsp; Я Покупатель
            </button>
            <button class="btn-tonal" style="height:56px" onclick="actions.login('seller', 'Aiaal Farm')">
                ${Icon('store')} &nbsp; Я Продавец
            </button>
            <button class="btn-tonal" style="height:56px" onclick="actions.login('courier', 'Fast Courier')">
                ${Icon('local_shipping')} &nbsp; Я Курьер
            </button>
        </div>
    </div>
`;

const renderProfile = (s) => {
    if (!s.user) return renderAuth(s);
    return `
    <div class="container" style="margin-top:24px">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:32px">
            <div style="width:80px; height:80px; border-radius:50%; background:var(--md-sys-color-primary-container); display:flex; align-items:center; justify-content:center; font-size:32px; color:var(--md-sys-color-on-primary-container)">
                ${s.user.name[0]}
            </div>
            <div>
                <h2 style="margin:0">${s.user.name}</h2>
                <div class="subhead">${t('role' + s.user.role.charAt(0).toUpperCase() + s.user.role.slice(1))}</div>
            </div>
        </div>

        ${s.user.role === 'seller' ? `
            <div class="md-card" style="padding:16px; margin-bottom:16px; background:var(--md-sys-color-secondary-container)">
                <h3>Панель Продавца</h3>
                <div style="display:flex; gap:8px; margin-top:16px">
                    <button class="btn-filled">${Icon('add')} Добавить товар</button>
                    <button class="btn-filled" onclick="actions.nav('home')">Мои товары</button>
                </div>
            </div>
        ` : ''}

        <div style="display:flex; flex-direction:column; gap:8px">
            <button class="btn-tonal" style="justify-content:flex-start" onclick="alert('Demo')">${Icon('favorite')} Избранное</button>
            <button class="btn-tonal" style="justify-content:flex-start" onclick="alert('Demo')">${Icon('settings')} Настройки</button>
            <button class="btn-tonal" style="justify-content:flex-start; color:var(--md-sys-color-error)" onclick="actions.logout()">${Icon('logout')} Выйти</button>
        </div>
    </div>
`;
};

const renderCart = (s) => `
    <div class="container" style="margin-top:24px">
        <h2>Корзина (${s.cart.length})</h2>
        <div style="margin-top:16px">
            ${s.cart.length === 0 ? '<p>Пусто</p>' : s.cart.map(item => `
                <div style="display:flex; justify-content:space-between; padding:16px; border-bottom:1px solid #eee">
                    <div><b>${item.title}</b> <br> ${item.quantity} x ${item.price} ₽</div>
                    <div>${item.quantity * item.price} ₽</div>
                </div>
            `).join('')}
        </div>
        ${s.cart.length ? `
            <div style="margin-top:24px; padding:16px; background:#eee; border-radius:16px">
                <div style="display:flex; justify-content:space-between; font-size:20px; font-weight:bold; margin-bottom:16px">
                    <span>Итого:</span>
                    <span>${s.cart.reduce((a, b) => a + (b.price * b.quantity), 0)} ₽</span>
                </div>
                <button class="btn-filled" style="width:100%; height:48px">Оплатить</button>
            </div>
        ` : ''}
    </div>
`;

// AI Modal
const renderAIModal = () => {
    const el = document.createElement('div');
    el.innerHTML = `
        <div class="modal-overlay" onclick="actions.toggleAI()">
            <div class="modal-dialog" onclick="event.stopPropagation()">
                <div style="display:flex; justify-content:space-between; margin-bottom:16px">
                    <h3>AI Assistant</h3>
                    <button class="btn-icon" onclick="actions.toggleAI()">${Icon('close')}</button>
                </div>
                <div style="height:200px; background:#f5f5f5; border-radius:12px; padding:12px; margin-bottom:12px; overflow-y:auto">
                    <div style="background:white; padding:8px 12px; border-radius:12px 12px 12px 0; margin-bottom:8px; width:fit-content">
                        ${t('aiHello')}
                    </div>
                </div>
                <div style="display:flex; gap:8px">
                    <input type="text" placeholder="Спроси рецепт..." class="search-input" style="background:#eee; border-radius:12px; padding:0 12px">
                    <button class="btn-icon" style="background:var(--md-sys-color-primary); color:white">${Icon('send')}</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(el);
};

// --- ACTIONS ---
window.actions = {
    nav: (page) => store.set({ page }),
    login: (role, name) => {
        store.set({ user: { id: Date.now(), role, name }, page: 'profile' });
    },
    logout: () => {
        store.set({ user: null, page: 'home' });
    },
    toggleLang: () => {
        const langs = ['ru', 'en', 'sah'];
        const current = store.get().lang;
        const next = langs[(langs.indexOf(current) + 1) % langs.length];
        localStorage.setItem('lang', next);
        store.set({ lang: next });
    },
    search: (q) => store.set({ searchQuery: q }),
    addToCart: (id) => {
        const s = store.get();
        const p = s.products.find(x => x.id === id);
        const exists = s.cart.find(x => x.id === id);
        let newCart;
        if (exists) {
            newCart = s.cart.map(x => x.id === id ? { ...x, quantity: x.quantity + 1 } : x);
        } else {
            newCart = [...s.cart, { ...p, quantity: 1 }];
        }
        store.set({ cart: newCart });
        // Toast Effect could be added here
    },
    toggleAI: () => {
        const open = store.get().aiChatOpen;
        if (open) document.querySelector('.modal-overlay')?.remove();
        store.set({ aiChatOpen: !open });
    },
    openProduct: (id) => alert('Product Details Page ID: ' + id)
};

// --- INIT ---
store.subscribe(renderApp); // Auto-render on state change
