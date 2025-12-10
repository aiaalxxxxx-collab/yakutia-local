// catalog.js — рендер списка товаров на главной странице

/**
 * Тип товара.
 * @typedef {Object} Product
 * @property {number|string} id - Идентификатор товара.
 * @property {string} title - Название товара.
 * @property {number} price - Цена.
 * @property {string} [desc] - Описание.
 * @property {string} [place] - Место/локация.
 * @property {string} [category] - Категория.
 * @property {number|null} [oldPrice]
 * @property {number|null} [discount]
 * @property {boolean} [promoted]
 * @property {boolean} [isSale]
 * @property {string|null} [imageUrl]
 */

/**
 * Отрисовать список товаров в контейнере #products-list.
 * @param {Product[]} products - Массив товаров.
 */
function renderProducts(products) {
  const container = document.getElementById('products-list');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <p style="grid-column: 1 / -1; font-size: 0.9rem; color: #6b7280;">
        Пока нет товаров по выбранным фильтрам.
      </p>
    `;
    return;
  }

  const cardsHtml = products
    .map((p) => createProductCardHtml(p))
    .join('');

  container.innerHTML = cardsHtml;
}

/**
 * Сгенерировать HTML одной карточки товара.
 * @param {Product} p - Товар.
 * @returns {string}
 */
function createProductCardHtml(p) {
  const hasOldPrice = p.oldPrice && Number(p.oldPrice) > Number(p.price);
  const badge = p.isSale
    ? '<span class="product-card__badge product-card__badge--sale">Sale</span>'
    : p.promoted
    ? '<span class="product-card__badge">Топ</span>'
    : '';

  const imageUrl = p.imageUrl || './assets/img/products/demo_placeholder.jpg';

  return `
    <article class="product-card" data-product-id="${p.id}" data-category="${p.category || 'other'}">
      <div class="product-card__image-wrapper">
        <img
          src="${imageUrl}"
          alt="${escapeHtml(p.title)}"
          class="product-card__image"
        />
        ${badge}
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title">${escapeHtml(p.title)}</h3>
        <p class="product-card__place">
          ${escapeHtml(p.place || 'Якутия')}
        </p>
        <p class="product-card__desc">
          ${escapeHtml(p.desc || '')}
        </p>
        <div class="product-card__prices">
          <span class="product-card__price-current">
            ${Number(p.price)} ₽
          </span>
          ${
            hasOldPrice
              ? `<span class="product-card__price-old">${Number(
                  p.oldPrice
                )} ₽</span>`
              : ''
          }
        </div>
      </div>
      <div class="product-card__footer">
        <button
          class="product-card__button product-card__button--primary js-add-to-cart"
        >
          В корзину
        </button>
        <button
          class="product-card__button js-add-to-favorites"
        >
          ❤ В избранное
        </button>
        <button
          class="product-card__button js-open-chat"
        >
          Написать продавцу
        </button>
        <div class="product-card__owner-actions">
          <button
            class="product-card__link js-edit-product"
          >
            Редактировать
          </button>
          <button
            class="product-card__link product-card__link--danger js-delete-product"
          >
            Удалить
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Простейший escape HTML, чтобы защититься от опасных символов.
 * @param {string} value - Входная строка.
 * @returns {string}
 */
function escapeHtml(value) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
