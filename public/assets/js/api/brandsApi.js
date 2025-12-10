// brandsApi.js — функции для работы с крупными производителями (brands)

/**
 * Получить список брендов.
 * @returns {Promise<Array<object>>}
 */
async function getBrands() {
  // GET /api/brands
  return apiRequest('/api/brands');
}
