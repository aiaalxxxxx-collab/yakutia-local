// productsApi.js — функции для работы с товарами (products)

/**
 * Получить список всех товаров.
 * @returns {Promise<Array<object>>}
 */
async function getProducts() {
  // GET /api/products
  return apiRequest('/api/products');
}

/**
 * Создать новый товар (продавец).
 * @param {object} data - Данные товара.
 * @returns {Promise<object>}
 */
async function createProduct(data) {
  return apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Обновить товар (продавец).
 * @param {number|string} id - ID товара.
 * @param {object} data - Обновлённые поля.
 * @returns {Promise<object>}
 */
async function updateProduct(id, data) {
  return apiRequest(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
