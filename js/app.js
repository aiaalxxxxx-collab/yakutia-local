/**
 * YAKUTIA ENTERPRISE CORE v2.0
 * Architecture: Component-Based State-Driven UI
 * Standard: ECMAScript 2024
 */

// --- 1. CORE UTILS (Инженерная база) ---
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Имитация React.createElement для чистого JS
const h = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([key, val]) => {
        if (key.startsWith('on') && typeof val === 'function') {
            el.addEventListener(key.toLowerCase().substring(2), val);
        } else if (key === 'className') {
            el.className = val;
        } else if (key === 'style' && typeof val === 'object') {
            Object.assign(el.style, val);
        } else {
            el.setAttribute(key, val);
        }
    });
    children.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    return el;
};

// State Manager (Redux-lite)
class Store {
    constructor(initialState) {
        this.state = initialState;
        this.listeners = new Set();
    }

    getState() { return this.state; }

    setState(newState) {
        this.state = { ...this.state, ...newState }; // Immutability pattern
        this.notify();
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.state));
    }
}

// --- 2. BUSINESS LOGIC (Слой данных) ---
const api = {
    async fetchProducts() {
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (e) {
            console.error('Data fetch failed', e);
            return [];
        }
    },
    async submitOrder(order) {
        return fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(order)
        });
    }
};

// Global Store Instance
const store = new Store({
    products: [],
    cart: JSON.parse(localStorage.getItem('cart_v2')) || [],
    filter: { category: 'all', search: '' },
    ui: { isCartOpen: false, isLoading: true }
});

// Effects (Side Effects)
store.subscribe(state => {
    localStorage.setItem('cart_v2', JSON.stringify(state.cart));
    // Dynamic Title update
    document.title = state.cart.length ? `(${state.cart.length}) Yakutia Local` : 'Yakutia Local';
});

// Actions
const actions = {
    async init() {
        store.setState({ ui: { ...store.state.ui, isLoading: true } });
        const products = await api.fetchProducts();
        // Fallback data for Demo if API fails
        const demoData = products.length ? products : [
            { id: 1, title: 'Оленина Premium', price: 850, category: 'meat', image: '/assets/img/meat.jpg', tags: ['hit'] },
            { id: 2, title: 'Чир Подледный', price: 1200, category: 'fish', image: '/assets/img/fish.jpg', tags: ['new'] },
            { id: 3, title: 'Брусника Таежная', price: 400, category: 'berries', image: '/assets/img/berry.jpg' }
        ];
        store.setState({ products: demoData, ui: { ...store.state.ui, isLoading: false } });
    },
    addToCart(product) {
        const { cart } = store.getState();
        const existing = cart.find(i => i.id === product.id);
        const newCart = existing 
            ? cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            : [...cart, { ...product, quantity: 1 }];
        store.setState({ cart: newCart });
    },
    removeFromCart(id) {
        const newCart = store.getState().cart.filter(i => i.id !== id);
        store.setState({ cart: newCart });
    },
    toggleCart(isOpen) {
        store.setState({ ui: { ...store.state.ui, isCartOpen: isOpen } });
    },
    setFilter(key, value) {
        store.setState({ filter: { ...store.state.filter, [key]: value } });
    }
};

// --- 3. UI COMPONENTS (Визуальный слой) ---

// Product Card Component
const ProductCard = (product) => {
    return h('article', { className: 'card animate-in' }, [
        h('div', { className: 'card__media' }, [
            h('img', { src: product.image || 'https://placehold.co/400x300?text=Yakutia', alt: product.title, loading: 'lazy' }),
            product.tags?.includes('hit') ? h('span', { className: 'badge badge--hot' }, ['HIT']) : ''
        ]),
        h('div', { className: 'card__content' }, [
            h('h3', { className: 'card__title' }, [product.title]),
            h('div', { className: 'card__meta' }, [
                h('span', { className: 'price' }, [`${product.price} ₽`]),
                h('button', { 
                    className: 'btn btn--primary btn--sm',
                    onClick: () => actions.addToCart(product)
                }, ['В корзину'])
            ])
        ])
    ]);
};

// Cart Item Component
const CartItem = (item) => {
    return h('div', { className: 'cart-item' }, [
        h('div', { className: 'cart-item__info' }, [
            h('div', { className: 'cart-item__title' }, [item.title]),
            h('div', { className: 'cart-item__price' }, [`${item.quantity} x ${item.price} ₽`])
        ]),
        h('button', { 
            className: 'btn-icon text-danger',
            onClick: () => actions.removeFromCart(item.id)
        }, ['✕'])
    ]);
};

// Main Renderer
const render = (state) => {
    // 1. Render Products
    const grid = $('#app-grid');
    if (grid) {
        grid.innerHTML = '';
        const filtered = state.products.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(state.filter.search.toLowerCase());
            const matchesCat = state.filter.category === 'all' || p.category === state.filter.category;
            return matchesSearch && matchesCat;
        });

        if (state.ui.isLoading) {
            grid.innerHTML = '<div class="loader-spinner"></div>';
        } else if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">Ничего не найдено</div>';
        } else {
            filtered.forEach(p => grid.appendChild(ProductCard(p)));
        }
    }

    // 2. Render Cart Counter
    const badge = $('#cart-badge');
    const totalCount = state.cart.reduce((acc, i) => acc + i.quantity, 0);
    if (badge) {
        badge.textContent = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
        // Animation pop
        if (totalCount > 0) {
            badge.classList.remove('pop');
            void badge.offsetWidth; // trigger reflow
            badge.classList.add('pop');
        }
    }

    // 3. Render Cart Modal
    const modal = $('#cart-modal');
    const list = $('#cart-list');
    const totalEl = $('#cart-total');
    
    if (modal && list) {
        if (state.ui.isCartOpen) {
            modal.classList.add('modal--active');
            list.innerHTML = '';
            state.cart.forEach(item => list.appendChild(CartItem(item)));
            if (state.cart.length === 0) list.innerHTML = '<p class="text-muted">Корзина пуста</p>';
            if (totalEl) totalEl.textContent = `${state.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)} ₽`;
        } else {
            modal.classList.remove('modal--active');
        }
    }
};

// --- 4. INIT & EVENTS (Связывание) ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial Render subscription
    store.subscribe(render);

    // Event Delegation
    $('#search-input')?.addEventListener('input', (e) => actions.setFilter('search', e.target.value));
    $('#category-filter')?.addEventListener('change', (e) => actions.setFilter('category', e.target.value));
    $('#cart-btn')?.addEventListener('click', () => actions.toggleCart(true));
    $('#close-cart')?.addEventListener('click', () => actions.toggleCart(false));
    $('#overlay')?.addEventListener('click', () => actions.toggleCart(false));

    // Start App
    actions.init();
});
