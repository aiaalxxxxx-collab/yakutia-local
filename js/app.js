/**
 * YAKUTIA MARKET PLATFORM
 * Architecture: Event-Driven State Management with Local Persistence
 * Engineer: Google Level
 */

// --- 1. PERSISTENCE LAYER (NoSQL Like) ---
const DB = {
    get: (key, def) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : def;
        } catch { return def; }
    },
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    
    // Convert File to Base64 (Real Image Upload)
    toBase64: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    })
};

// --- 2. INITIAL DATA SEEDING ---
const defaultProducts = [
    { id: 1, title: 'Оленина Премиум', price: 1200, category: 'meat', sellerId: 'seller_1', img: 'https://placehold.co/600x400/00639b/white?text=Meat', rating: 5.0 },
    { id: 2, title: 'Чир Свежий', price: 950, category: 'fish', sellerId: 'seller_1', img: 'https://placehold.co/600x400/00639b/white?text=Fish', rating: 4.9 },
    { id: 3, title: 'Брусника', price: 3000, category: 'berry', sellerId: 'seller_2', img: 'https://placehold.co/600x400/00639b/white?text=Berry', rating: 4.8 },
];

// --- 3. STATE STORE ---
const store = {
    state: {
        user: DB.get('user', null), // Auth Persistence
        lang: DB.get('lang', 'ru'),
        products: DB.get('products', defaultProducts),
        cart: DB.get('cart', []),
        chats: DB.get('chats', []), // Real Chat History
        orders: DB.get('orders', []),
        favorites: DB.get('fav', []),
        page: 'home',
        aiOpen: false
    },
    
    // Reactive Setter
    update(fn) {
        fn(this.state);
        // Auto-save everything
        DB.set('user', this.state.user);
        DB.set('lang', this.state.lang);
        DB.set('products', this.state.products);
        DB.set('cart', this.state.cart);
        DB.set('chats', this.state.chats);
        DB.set('orders', this.state.orders);
        DB.set('fav', this.state.favorites);
        app.render();
    }
};

// --- 4. I18N DICTIONARY ---
const T = {
    ru: { brand: 'YakutiaMarket', search: 'Поиск...', meat: 'Мясо', fish: 'Рыба', berry: 'Ягоды', milk: 'Молоко', login: 'Войти', add: 'Добавить', sellerPanel: 'Кабинет Продавца' },
    en: { brand: 'YakutiaMarket', search: 'Search...', meat: 'Meat', fish: 'Fish', berry: 'Berry', milk: 'Milk', login: 'Login', add: 'Add', sellerPanel: 'Seller Dashboard' },
    sah: { brand: 'СахаМаркет', search: 'Көрдөөһүн...', meat: 'Эт', fish: 'Балык', berry: 'Отон', milk: 'Үүт', login: 'Киир', add: 'Эбэн', sellerPanel: 'Атыыһыт' }
};

// --- 5. HELPERS & COMPONENTS ---
const Icon = (n) => `<span class="material-symbols-rounded">${n}</span>`;

// Header Component
const Header = (s, t) => `
    <header class="top-app-bar">
        <div class="brand" onclick="Actions.nav('home')">
            ${Icon('storefront')} ${t.brand}
        </div>
        <div class="actions-row">
            <button class="btn-text" onclick="Actions.lang()"><b>${s.lang.toUpperCase()}</b></button>
            ${s.user 
                ? `<div class="user-chip" onclick="Actions.nav('profile')">
                     <div class="avatar-xs">${s.user.name[0]}</div>
                     <span class="desktop-only">${s.user.name}</span>
                   </div>`
                : `<button class="btn-filled small" onclick="Actions.nav('auth')">${t.login}</button>`
            }
            <button class="btn-icon" onclick="Actions.nav('cart')">
                ${Icon('shopping_bag')}
                ${s.cart.length ? `<span class="badge-dot"></span>` : ''}
            </button>
        </div>
    </header>
`;

// --- 6. PAGES ---

const PageHome = (s, t) => `
    <div class="hero-search">
        <div class="search-bar">
            ${Icon('search')}
            <input placeholder="${t.search}" oninput="Actions.search(this.value)">
        </div>
        <div class="categories">
            <button class="chip" onclick="Actions.filter('all')">Все</button>
            <button class="chip" onclick="Actions.filter('meat')">${t.meat}</button>
            <button class="chip" onclick="Actions.filter('fish')">${t.fish}</button>
            <button class="chip" onclick="Actions.filter('berry')">${t.berry}</button>
        </div>
    </div>
    <div class="container card-grid">
        ${s.products.map(p => `
            <div class="md-card">
                <div class="card-media">
                    <img src="${p.img}">
                    ${s.user?.role === 'seller' ? `
                        <button class="edit-fab" onclick="event.stopPropagation(); Actions.editProduct(${p.id})">${Icon('edit')}</button>
                        <button class="delete-fab" onclick="event.stopPropagation(); Actions.deleteProduct(${p.id})">${Icon('delete')}</button>
                    ` : ''}
                    <button class="fav-btn ${s.favorites.includes(p.id) ? 'active' : ''}" onclick="event.stopPropagation(); Actions.toggleFav(${p.id})">${Icon('favorite')}</button>
                </div>
                <div class="card-content" onclick="Actions.nav('chat', {withId: p.sellerId})">
                    <div class="headline">${p.title}</div>
                    <div class="price-row">
                        <span class="price">${p.price} ₽</span>
                        <button class="btn-tonal-icon" onclick="event.stopPropagation(); Actions.addToCart(${p.id})">${Icon('add')}</button>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
`;

const PageProfile = (s, t) => `
    <div class="container animate-slide">
        <div class="profile-header">
            <div class="avatar-xl">${s.user.name[0]}</div>
            <div>
                <h1>${s.user.name}</h1>
                <div class="role-badge">${s.user.role.toUpperCase()}</div>
            </div>
        </div>

        ${s.user.role === 'seller' ? `
            <div class="section-title">${t.sellerPanel}</div>
            <div class="dashboard-grid">
                <div class="dash-card blue" onclick="Actions.addProductPrompt()">
                    ${Icon('add_a_photo')} <span>Новый товар</span>
                    <!-- Hidden File Input for Real Upload -->
                    <input type="file" id="img-upload" hidden onchange="Actions.handleFile(this)">
                </div>
                <div class="dash-card orange">
                    ${Icon('analytics')} <span>Продажи: ${s.orders.length}</span>
                </div>
            </div>
        ` : ''}

        <div class="menu-list">
            <div class="menu-item" onclick="Actions.nav('orders')"> ${Icon('receipt_long')} Мои заказы (${s.orders.length}) </div>
            <div class="menu-item" onclick="Actions.nav('cart')"> ${Icon('favorite')} Избранное (${s.favorites.length}) </div>
            <div class="menu-item text-red" onclick="Actions.logout()"> ${Icon('logout')} Выйти </div>
        </div>
    </div>
`;

const PageAuth = () => `
    <div class="container auth-container">
        <h1>Welcome</h1>
        <div class="role-select">
            <div class="role-card" onclick="Actions.login('buyer')">${Icon('person')} Покупатель</div>
            <div class="role-card" onclick="Actions.login('seller')">${Icon('store')} Продавец</div>
            <div class="role-card" onclick="Actions.login('courier')">${Icon('local_shipping')} Курьер</div>
        </div>
    </div>
`;

const PageCart = (s) => `
    <div class="container animate-slide">
        <h1>Корзина (${s.cart.length})</h1>
        ${s.cart.map(i => `
            <div class="cart-item">
                <img src="${i.img}">
                <div class="info"><b>${i.title}</b><br>${i.price} ₽</div>
                <div class="qty">
                    <button onclick="Actions.qty(${i.id}, -1)">-</button>
                    ${i.quantity}
                    <button onclick="Actions.qty(${i.id}, 1)">+</button>
                </div>
            </div>
        `).join('')}
        ${s.cart.length ? `
            <div class="total-bar">
                <b>Итого: ${s.cart.reduce((a,b)=>a+b.price*b.quantity,0)} ₽</b>
                <button class="btn-filled" onclick="Actions.checkout()">Заказать</button>
            </div>
        ` : '<p>Пусто</p>'}
    </div>
`;

const PageChat = (s) => `
    <div class="container chat-layout">
        <div class="chat-header-page">
            <button onclick="Actions.nav('home')">${Icon('arrow_back')}</button>
            <span>Чат с продавцом</span>
        </div>
        <div class="chat-body" id="chat-feed">
            ${(s.chats || []).map(m => `<div class="msg ${m.from === s.user.id ? 'me' : 'other'}">${m.text}</div>`).join('')}
        </div>
        <div class="chat-input-area">
            <input id="chat-in" placeholder="Сообщение...">
            <button onclick="Actions.sendChat()">${Icon('send')}</button>
        </div>
    </div>
`;

const AIModal = () => `
    <div class="modal-overlay" onclick="Actions.toggleAI()">
        <div class="ai-dialog animate-up" onclick="event.stopPropagation()">
            <div class="ai-header">${Icon('smart_toy')} AI Assistant</div>
            <div class="ai-body">
                <div class="msg ai">Привет! Я помогу с рецептами для Якутских продуктов.</div>
            </div>
            <div class="ai-input"><input placeholder="Спроси..."><button>${Icon('send')}</button></div>
        </div>
    </div>
`;

// --- 7. CONTROLLER (Business Logic) ---
const Actions = {
    nav: (p, data) => store.update(s => { s.page = p; s.navData = data; }),
    lang: () => store.update(s => s.lang = s.lang === 'ru' ? 'en' : 'ru'),
    
    login: (role) => store.update(s => {
        s.user = { id: Date.now(), role, name: role === 'seller' ? 'Айаал Фермер' : 'User ' + Date.now().toString().slice(-4) };
        s.page = 'profile';
    }),
    logout: () => store.update(s => { s.user = null; s.page = 'home'; }),
    
    // CRUD PRODUCTS (REAL)
    addProductPrompt: () => document.getElementById('img-upload').click(),
    handleFile: async (input) => {
        if (!input.files[0]) return;
        const base64 = await DB.toBase64(input.files[0]);
        const title = prompt("Название товара?");
        const price = prompt("Цена?");
        if (title && price) {
            store.update(s => {
                s.products.push({
                    id: Date.now(), title, price: Number(price), 
                    category: 'meat', sellerId: s.user.id, img: base64 // SAVING REAL IMAGE
                });
            });
        }
    },
    deleteProduct: (id) => {
        if(confirm('Удалить?')) store.update(s => s.products = s.products.filter(p => p.id !== id));
    },
    editProduct: (id) => {
        const p = store.state.products.find(x=>x.id===id);
        const np = prompt("Новая цена?", p.price);
        if(np) store.update(s => s.products.find(x=>x.id===id).price = Number(np));
    },

    // CART & ORDERS
    addToCart: (id) => store.update(s => {
        const p = s.products.find(x => x.id === id);
        const exist = s.cart.find(x => x.id === id);
        if(exist) exist.quantity++; else s.cart.push({...p, quantity: 1});
        // Feedback
        const toast = document.createElement('div'); toast.className='toast'; toast.textContent='Добавлено!'; document.body.appendChild(toast); setTimeout(()=>toast.remove(),1000);
    }),
    qty: (id, d) => store.update(s => {
        const item = s.cart.find(x => x.id === id);
        item.quantity += d;
        if(item.quantity <= 0) s.cart = s.cart.filter(x => x.id !== id);
    }),
    checkout: () => store.update(s => {
        s.orders.push({ id: Date.now(), items: [...s.cart], date: new Date().toLocaleString() });
        s.cart = [];
        alert('Заказ оформлен! См. в профиле.');
    }),
    toggleFav: (id) => store.update(s => {
        if(s.favorites.includes(id)) s.favorites = s.favorites.filter(x=>x!==id);
        else s.favorites.push(id);
    }),

    // CHAT
    sendChat: () => {
        const inp = document.getElementById('chat-in');
        if(!inp.value) return;
        store.update(s => {
            if(!s.chats) s.chats = [];
            s.chats.push({ text: inp.value, from: s.user.id, date: Date.now() });
        });
        inp.value = '';
    },
    toggleAI: () => store.update(s => s.aiOpen = !s.aiOpen),
    
    // SEARCH & FILTER
    search: (q) => {
        const all = DB.get('products', defaultProducts);
        store.update(s => s.products = all.filter(p => p.title.toLowerCase().includes(q.toLowerCase())));
    },
    filter: (cat) => {
        const all = DB.get('products', defaultProducts);
        store.update(s => s.products = cat === 'all' ? all : all.filter(p => p.category === cat));
    }
};

// --- RENDER LOOP ---
const app = {
    render: () => {
        const s = store.state;
        const t = T[s.lang];
        const root = document.getElementById('app');
        let content = '';
        
        if (s.page === 'home') content = PageHome(s, t);
        else if (s.page === 'auth') content = PageAuth(s, t);
        else if (s.page === 'profile') content = PageProfile(s, t);
        else if (s.page === 'cart') content = PageCart(s, t);
        else if (s.page === 'chat') content = PageChat(s, t);
        else if (s.page === 'orders') content = `<div class="container"><h1>Мои Заказы</h1>${s.orders.map(o => `<div class="md-card" style="padding:16px; margin-bottom:10px"><b>Заказ #${o.id}</b><br>${o.date}</div>`).join('')}</div>`;

        root.innerHTML = `${Header(s, t)}<main>${content}</main> <button class="fab-main" onclick="Actions.toggleAI()">${Icon('smart_toy')}</button> ${s.aiOpen ? AIModal() : ''}`;
    }
};

// INIT
app.render();
