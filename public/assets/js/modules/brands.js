// brands.js — рендер списка крупных производителей

/**
 * Тип бренда.
 * @typedef {Object} Brand
 * @property {number|string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string[]} [categories]
 * @property {string} [logoUrl]
 */

/**
 * Отрисовать список брендов в контейнере #brands-list.
 * @param {Brand[]} brands - Массив брендов.
 */
function renderBrands(brands) {
  const container = document.getElementById('brands-list');
  if (!container) return;

  if (!brands || brands.length === 0) {
    container.innerHTML = `
      <p style="grid-column: 1 / -1; font-size: 0.9rem; color: #6b7280;">
        Пока нет добавленных производителей.
      </p>
    `;
    return;
  }

  const html = brands
    .map((b) => createBrandCardHtml(b))
    .join('');

  container.innerHTML = html;
}

/**
 * Сгенерировать HTML карточки бренда.
 * @param {Brand} b - Бренд.
 * @returns {string}
 */
function createBrandCardHtml(b) {
  const logoUrl = b.logoUrl || './assets/img/brands/demo_placeholder.png';
  const cats = Array.isArray(b.categories) ? b.categories.join(', ') : '';

  return `
    <article class="brand-card" data-brand-id="${b.id}">
      <div class="brand-card__logo-wrapper">
        <img
          src="${logoUrl}"
          alt="${escapeHtml(b.name)}"
          class="brand-card__logo"
        />
      </div>
      <div class="brand-card__body">
        <h3 class="brand-card__title">
          ${escapeHtml(b.name)}
        </h3>
        <p class="brand-card__categories">
          Категории: ${escapeHtml(cats)}
        </p>
        <p class="brand-card__desc">
          ${escapeHtml(b.description || '')}
        </p>
        <button
          class="brand-card__button js-open-brand"
        >
          Подробнее о производителе
        </button>
      </div>
    </article>
  `;
}
