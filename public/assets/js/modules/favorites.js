// favorites.js — избранные товары (localStorage)

/**
 * Ключ для хранения избранных товаров.
 * @type {string}
 */
const FAV_KEY = 'yakutia_favorites';

/**
 * Получить массив id избранных товаров.
 * @returns {Array<number|string>}
 */
function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Сохранить массив id избранных товаров.
 * @param {Array<number|string>} ids
 */
function saveFavoriteIds(ids) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

/**
 * Переключить товар в избранном.
 * @param {number|string} productId
 * @returns {boolean} - true, если стал избранным, false если убран.
 */
function toggleFavorite(productId) {
  const ids = getFavoriteIds();
  const index = ids.indexOf(productId);
  let isNowFav;
  if (index === -1) {
    ids.push(productId);
    isNowFav = true;
  } else {
    ids.splice(index, 1);
    isNowFav = false;
  }
  saveFavoriteIds(ids);
  return isNowFav;
}

/**
 * Проверить, находится ли товар в избранном.
 * @param {number|string} productId
 * @returns {boolean}
 */
function isFavorite(productId) {
  return getFavoriteIds().includes(productId);
}
