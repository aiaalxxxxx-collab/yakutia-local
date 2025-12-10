// usersApi.js — функции для работы с пользователями (auth/profiles)

/**
 * Получить текущего пользователя по токену.
 * @returns {Promise<{id:number,name:string,email:string,role:string}>}
 */
async function getCurrentUser() {
  return apiRequest('/api/users/me');
}
