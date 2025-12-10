// indexPage.js — точка входа для главной страницы
// Загружает товары и бренды и рендерит их.

/**
 * Инициализация главной страницы.
 * Загружаем товары и бренды, показываем их в каталоге.
 */
async function initIndexPage() {
  const productsContainer = document.getElementById('products-list');
  const brandsContainer = document.getElementById('brands-list');

  if (productsContainer) {
    productsContainer.innerHTML = '<p>Загружаем товары…</p>';
  }
  if (brandsContainer) {
    brandsContainer.innerHTML = '<p>Загружаем производителей…</p>';
  }

  try {
    const [products, brands] = await Promise.all([
      getProducts(),
      getBrands()
    ]);

    renderProducts(products || []);
    renderBrands(brands || []);
  } catch (err) {
    console.error('Ошибка загрузки каталога:', err);
    if (productsContainer) {
      productsContainer.innerHTML =
        '<p style="color:#b91c1c;">Не удалось загрузить товары. Попробуйте обновить страницу.</p>';
    }
    if (brandsContainer) {
      brandsContainer.innerHTML =
        '<p style="color:#b91c1c;">Не удалось загрузить производителей.</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', initIndexPage);
