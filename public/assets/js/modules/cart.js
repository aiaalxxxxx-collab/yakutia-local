// cart.js — простая корзина на фронте (localStorage)

/**
 * Ключ для хранения корзины в localStorage.
 * @type {string}
 */
const CART_KEY = 'yakutia_cart';

/**
 * Прочитать корзину из localStorage.
 * @returns {Array<{productId: number|string, quantity: number}>}
 */
function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Сохранить корзину в localStorage.
 * @param {Array<{productId: number|string, quantity: number}>} items
 */
function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/**
 * Добавить товар в корзину.
 * @param {number|string} productId - Идентификатор товара.
 */
function addToCart(productId) {
  const items = getCartItems();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ productId, quantity: 1 });
  }
  saveCartItems(items);
}

/**
 * Посчитать количество позиций в корзине.
 * @returns {number}
 */
function getCartCount() {
  return getCartItems().reduce((sum, i) => sum + i.quantity, 0);
}
