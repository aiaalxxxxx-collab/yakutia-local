// apiClient.js — общая обёртка над fetch
// Работает с JSON API, добавляет токен авторизации и обрабатывает ошибки.

/**
 * Выполнить запрос к API.
 * @param {string} url - Путь, например '/api/products'.
 * @param {RequestInit} [options] - Дополнительные опции fetch.
 * @returns {Promise<any>} - Распарсенный JSON-ответ.
 */
async function apiRequest(url, options = {}) {
  // Берём токен из localStorage (если пользователь авторизован)
  const token = localStorage.getItem('yakutia_token') || null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // тело не JSON — игнорируем
    }
    const err = new Error('API error');
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
