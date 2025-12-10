// cabinetPage.js — логика работы Личного кабинета
// Переключение ролей, профили, список объявлений продавца, форма создания/редактирования.

/** @type {string|null} */
let currentRole = 'buyer';
/** @type {any|null} */
let currentUser = null;
/** @type {Array<any>} */
let sellerProducts = [];

/**
 * Инициализация страницы кабинета.
 */
async function initCabinetPage() {
  // Определяем пользователя по токену (если есть)
  try {
    currentUser = await getCurrentUser();
    renderCurrentUserHeader(currentUser);
    if (currentUser && currentUser.role) {
      // Если у юзера своя роль — включим соответствующую вкладку
      switchRole(currentUser.role);
    }
  } catch {
    // Гость или токен невалиден — оставляем роль "покупатель"
    currentUser = null;
  }

  initRoleTabs();
  initProfileForms();
  if (currentUser && currentUser.role === 'seller') {
    await loadSellerProducts();
    bindSellerProductModal();
  } else {
    bindSellerProductModal(); // хотя бы откроется пустая форма
  }
}

/**
 * Показать имя и роль в шапке Кабинета.
 * @param {{name?:string,role?:string,email?:string}} user
 */
function renderCurrentUserHeader(user) {
  const nameEl = document.getElementById('current-user-name');
  if (!nameEl || !user) return;
  const roleLabel =
    user.role === 'seller'
      ? 'продавец'
      : user.role === 'courier'
      ? 'курьер'
      : 'покупатель';
  nameEl.textContent = `${user.name || user.email || 'Пользователь'} (роль: ${roleLabel})`;
}

/**
 * Инициализировать переключение вкладок ролей.
 */
function initRoleTabs() {
  const tabs = document.querySelectorAll('.cabinet__role-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const role = tab.getAttribute('data-role');
      if (!role) return;
      switchRole(role);
    });
  });
}

/**
 * Переключить роль/панель кабинета.
 * @param {'buyer'|'seller'|'courier'} role
 */
function switchRole(role) {
  currentRole = role;

  // Кнопки-вкладки
  const tabs = document.querySelectorAll('.cabinet__role-tab');
  tabs.forEach((tab) => {
    const r = tab.getAttribute('data-role');
    if (r === role) {
      tab.classList.add('cabinet__role-tab--active');
    } else {
      tab.classList.remove('cabinet__role-tab--active');
    }
  });

  // Панели
  const panels = document.querySelectorAll('.cabinet__role-panel');
  panels.forEach((panel) => {
    if (panel.id === `cabinet-${role}`) {
      panel.classList.add('cabinet__role-panel--active');
    } else {
      panel.classList.remove('cabinet__role-panel--active');
    }
  });
}

/**
 * Инициализировать обработчики форм профилей (пока просто alert + console).
 */
function initProfileForms() {
  const buyerForm = document.getElementById('buyer-profile-form');
  if (buyerForm) {
    buyerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(buyerForm).entries());
      console.log('Сохранение профиля покупателя:', data);
      alert('Профиль покупателя сохранён (демо, без сервера).');
    });
  }

  const sellerForm = document.getElementById('seller-profile-form');
  if (sellerForm) {
    sellerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(sellerForm).entries());
      console.log('Сохранение профиля продавца:', data);
      alert('Профиль продавца сохранён (демо, без сервера).');
    });
  }

  const courierForm = document.getElementById('courier-profile-form');
  if (courierForm) {
    courierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(courierForm).entries());
      console.log('Сохранение профиля курьера:', data);
      alert('Профиль курьера сохранён (демо, без сервера).');
    });
  }
}

/**
 * Загрузить товары текущего продавца и отрисовать их.
 */
async function loadSellerProducts() {
  try {
    const allProducts = await getProducts();
    // В JSON сервера товары имеют поле sellerId, фильтруем по текущему юзеру.
    sellerProducts = Array.isArray(allProducts)
      ? allProducts.filter((p) => p.sellerId === currentUser.id)
      : [];

    renderSellerProductsList();
  } catch (e) {
    console.error('Ошибка загрузки объявлений продавца:', e);
  }
}

/**
 * Отрисовать список объявлений продавца в блоке #seller-products-list.
 */
function renderSellerProductsList() {
  const listEl = document.getElementById('seller-products-list');
  if (!listEl) return;

  if (!sellerProducts.length) {
    listEl.innerHTML =
      '<p style="font-size:0.9rem;color:#6b7280;">У вас пока нет опубликованных объявлений.</p>';
    return;
  }

  const html = sellerProducts
    .map(
      (p) => `
      <div class="seller-product-row" data-product-id="${p.id}">
        <div class="seller-product-row__main">
          <strong>${escapeHtml(p.title)}</strong>
          <span>${Number(p.price)} ₽</span>
          <span>${escapeHtml(p.category || '')}</span>
        </div>
        <div class="seller-product-row__actions">
          <button class="seller-product-row__btn js-seller-edit">Редактировать</button>
          <button class="seller-product-row__btn seller-product-row__btn--danger js-seller-delete">Удалить</button>
        </div>
      </div>
    `
    )
    .join('');

  listEl.innerHTML = html;

  listEl.addEventListener(
    'click',
    async (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      const row = target.closest('.seller-product-row');
      if (!row) return;
      const id = Number(row.getAttribute('data-product-id'));
      const product = sellerProducts.find((p) => p.id === id);
      if (!product) return;

      if (target.closest('.js-seller-edit')) {
        openProductEditModal(product);
        return;
      }

      if (target.closest('.js-seller-delete')) {
        if (!confirm('Удалить это объявление?')) return;
        // В боевой версии здесь вызовем реальное API удаления
        alert('Удаление товара пока заглушка. API delete можно добавить позже.');
        return;
      }
    },
    { once: true }
  );
}

/**
 * Привязать кнопку "Добавить объявление" и форму модалки.
 */
function bindSellerProductModal() {
  const openBtn = document.getElementById('seller-add-product-button');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openProductEditModal(null);
    });
  }

  const form = document.getElementById('product-edit-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'seller') {
      alert('Создавать объявления может только авторизованный продавец.');
      return;
    }

    const formData = new FormData(form);
    const raw = Object.fromEntries(formData.entries());

    const payload = {
      title: raw.title || '',
      price: Number(raw.price) || 0,
      oldPrice: raw.oldPrice ? Number(raw.oldPrice) : null,
      discount: raw.discount ? Number(raw.discount) : null,
      category: raw.category || 'other',
      place: raw.place || 'Якутия',
      desc: raw.desc || '',
      promoted: !!raw.promoted,
      isSale: !!raw.isSale
      // imageUrl пока не трогаем (нужен отдельный upload)
    };

    const id = raw.id ? Number(raw.id) : null;

    try {
      if (id) {
        await updateProduct(id, payload);
        alert('Объявление обновлено (демо).');
      } else {
        await createProduct(payload);
        alert('Объявление создано (демо).');
      }
      closeProductEditModal();
      await loadSellerProducts();
    } catch (e) {
      console.error('Ошибка сохранения объявления:', e);
      alert('Не удалось сохранить объявление.');
    }
  });
}

/**
 * Открыть модалку редактирования товара.
 * @param {any|null} product - Товар или null для нового.
 */
function openProductEditModal(product) {
  const modal = document.getElementById('product-edit-modal');
  const titleEl = document.getElementById('product-edit-title');
  const form = document.getElementById('product-edit-form');
  const preview = document.getElementById('product-image-preview');

  if (!modal || !form) return;

  if (product) {
    titleEl.textContent = 'Редактирование объявления';
    form.elements.id.value = product.id;
    form.elements.title.value = product.title || '';
    form.elements.price.value = product.price || '';
    form.elements.oldPrice.value = product.oldPrice || '';
    form.elements.discount.value = product.discount || '';
    form.elements.category.value = product.category || 'other';
    form.elements.place.value = product.place || '';
    form.elements.desc.value = product.desc || '';
    form.elements.promoted.checked = !!product.promoted;
    form.elements.isSale.checked = !!product.isSale;
    if (preview && product.imageUrl) {
      preview.src = product.imageUrl;
      preview.hidden = false;
    }
  } else {
    titleEl.textContent = 'Новое объявление';
    form.reset();
    form.elements.id.value = '';
    if (preview) {
      preview.hidden = true;
      preview.src = '';
    }
  }

  modal.classList.add('modal--open');
}

/**
 * Закрыть модалку редактирования товара.
 */
function closeProductEditModal() {
  const modal = document.getElementById('product-edit-modal');
  if (modal) {
    modal.classList.remove('modal--open');
  }
}

/**
 * Утилита экранирования HTML.
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

document.addEventListener('DOMContentLoaded', initCabinetPage);
