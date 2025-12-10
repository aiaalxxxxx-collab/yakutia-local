// productsApi.js — функции для работы с товарами (products)

/**
 * Получить список всех товаров.
 * @returns {Promise<Array<object>>}
 */
async function getProducts() {
  // GET /api/products
  return apiRequest('/api/products');
}
