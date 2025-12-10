// catalog.js — рендер списка товаров на главной странице и обработка кнопок

/**
 * Тип товара.
 * @typedef {Object} Product
 * @property {number|string} id
 * @property {string} title
 * @property {number} price
 * @property {string} [desc]
 * @property {string} [place]
 * @property {string} [category]
 * @property {number|null} [oldPrice]
 * @property {number|null} [discount]
 * @property {boolean} [promoted]
 * @property {boolean} [isSale]
 * @property {string|null} [imageUrl]
 */

/** @type {Product[]} */
let currentProducts = [];

/**
 * Отрисовать список товаров в контейнере #products-list.
 * @param {Product[]} products
 */
function renderProducts(products) {
  currentProducts = Array.isArray(products) ? products : [];

  const container = document.getElementById('products-list');
  if (!container) return;

  if (!currentProducts.length) {
    container.innerHTML = `
      <p style="grid-column: 1 / -1; font-size: 0.9rem; color: #6b7280;">
        Пока нет товаров по выбранным фильтрам.
      </p>
    `;
    return;
  }

  const cardsHtml = currentProducts
    .map((p) => createProductCardHtml(p))
    .join('');

  container.innerHTML = cardsHtml;

  // После вставки HTML навешиваем обработчики на кнопки
  bindProductCardEvents(container);
}

/**
 * Сгенерировать HTML одной карточки товара.
 * @param {Product} p
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
  const favClass = isFavorite(p.id) ? ' product-card__button--fav-active' : '';

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
          class="product-card__button js-add-to-favorites${favClass}"
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
 * Навесить обработчики на кнопки внутри контейнера с карточками.
 * @param {HTMLElement} container
 */
function bindProductCardEvents(container) {
  // Делегирование событий по клику
  container.addEventListener('click', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    const card = target.closest('.product-card');
    if (!card) return;

    const productIdAttr = card.getAttribute('data-product-id');
    const productId = Number(productIdAttr);
    const product = currentProducts.find((p) => p.id === productId);
    if (!product) return;

    // В корзину
    if (target.closest('.js-add-to-cart')) {
      addToCart(product.id);
      alert('Товар добавлен в корзину');
      return;
    }

    // Избранное
    if (target.closest('.js-add-to-favorites')) {
      const isNowFav = toggleFavorite(product.id);
      if (isNowFav) {
        target.classList.add('product-card__button--fav-active');
      } else {
        target.classList.remove('product-card__button--fav-active');
      }
      return;
    }

    // Чат
    if (target.closest('.js-open-chat')) {
      // Здесь позже откроем модалку чата c продуктом
      alert('Тут откроется чат с продавцом по этому товару.');
      return;
    }

    // Редактировать
    if (target.closest('.js-edit-product')) {
      alert('Редактирование товара: нужно открыть форму в кабинете продавца.');
      return;
    }

    // Удалить
    if (target.closest('.js-delete-product')) {
      const confirmed = confirm('Удалить это объявление?');
      if (!confirmed) return;
      alert('В боевой версии здесь вызовем API удаления товара.');
      return;
    }
  }, { once: true });
}

/**
 * Простейший escape HTML.
 * @param {string} value
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
