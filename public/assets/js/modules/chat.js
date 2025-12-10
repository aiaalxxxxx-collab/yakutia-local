// chat.js — логика чата с продавцом на фронте
// Использует модалку #chat-modal из index.html / Cabinet.html.

/**
 * Открыть чат по товару.
 * @param {number|string} productId - ID товара.
 * @param {string} [productTitle] - Название товара (для заголовка).
 */
function openChatForProduct(productId, productTitle) {
  const modal = document.getElementById('chat-modal');
  const messagesEl = document.getElementById('chat-messages');
  const inputEl = document.getElementById('chat-input');

  if (!modal || !messagesEl || !inputEl) return;

  modal.dataset.productId = String(productId);
  messagesEl.innerHTML = '';

  // Заглушка: подгружаем историю чата из localStorage
  const history = loadChatHistory(productId);
  history.forEach((msg) => {
    appendChatMessage(msg.author, msg.text, msg.createdAt);
  });

  // Можно отобразить название товара вверху (если нужно)
  if (productTitle) {
    const titleEl = modal.querySelector('.modal__title');
    if (titleEl) {
      titleEl.textContent = `Чат по товару: ${productTitle}`;
    }
  }

  modal.classList.add('modal--open');
  inputEl.focus();
}

/**
 * Закрыть чат.
 */
function closeChat() {
  const modal = document.getElementById('chat-modal');
  if (modal) {
    modal.classList.remove('modal--open');
  }
}

/**
 * Добавить сообщение в DOM.
 * @param {'user'|'seller'} author
 * @param {string} text
 * @param {string} [createdAt]
 */
function appendChatMessage(author, text, createdAt) {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'chat__message chat__message--' + author;

  const meta = document.createElement('div');
  meta.className = 'chat__meta';
  meta.textContent =
    (author === 'user' ? 'Вы' : 'Продавец') +
    (createdAt ? ` • ${new Date(createdAt).toLocaleTimeString()}` : '');

  const body = document.createElement('div');
  body.className = 'chat__text';
  body.textContent = text;

  wrapper.appendChild(meta);
  wrapper.appendChild(body);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Отправить сообщение из инпута.
 */
function sendChatMessageFromInput() {
  const modal = document.getElementById('chat-modal');
  const inputEl = document.getElementById('chat-input');
  if (!modal || !inputEl) return;

  const productId = modal.dataset.productId;
  const text = inputEl.value.trim();
  if (!productId || !text) return;

  const msg = {
    author: 'user',
    text,
    createdAt: new Date().toISOString()
  };

  appendChatMessage(msg.author, msg.text, msg.createdAt);

  // Сохраняем в localStorage (демо-реализация без настоящего сервера)
  saveChatMessage(productId, msg);

  inputEl.value = '';
}

/**
 * Ключ для хранения чатов.
 * @type {string}
 */
const CHAT_KEY = 'yakutia_chats';

/**
 * Загрузить историю чата по товару.
 * @param {number|string} productId
 * @returns {Array<{author:string,text:string,createdAt:string}>}
 */
function loadChatHistory(productId) {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const key = String(productId);
    return Array.isArray(parsed[key]) ? parsed[key] : [];
  } catch {
    return [];
  }
}

/**
 * Сохранить сообщение в истории чата.
 * @param {number|string} productId
 * @param {{author:string,text:string,createdAt:string}} msg
 */
function saveChatMessage(productId, msg) {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const key = String(productId);
    if (!Array.isArray(store[key])) store[key] = [];
    store[key].push(msg);
    localStorage.setItem(CHAT_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Не удалось сохранить чат:', e);
  }
}

/**
 * Навесить общие обработчики для модалки чата (закрытие и отправка).
 * Вызывается один раз на странице.
 */
function initChatModal() {
  const modal = document.getElementById('chat-modal');
  const sendBtn = document.getElementById('chat-send');
  const inputEl = document.getElementById('chat-input');

  if (!modal) return;

  modal.addEventListener('click', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (target.hasAttribute('data-modal-close') || target.classList.contains('modal__close-button')) {
      closeChat();
    }
  });

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      sendChatMessageFromInput();
    });
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessageFromInput();
      }
    });
  }
}

// Инициализируем модалку чата после загрузки DOM
document.addEventListener('DOMContentLoaded', initChatModal);
