// bot.js — простой rule-based помощник (ИИ-бот) на фронте
// Использует виджет с id="bot-toggle", "bot-panel", "bot-input", "bot-messages", "bot-send".

/**
 * Инициализация виджета бота.
 */
function initBotWidget() {
  const toggleBtn = document.getElementById('bot-toggle');
  const panel = document.getElementById('bot-panel');
  const input = document.getElementById('bot-input');
  const sendBtn = document.getElementById('bot-send');

  if (!toggleBtn || !panel || !input || !sendBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = panel.hasAttribute('hidden');
    if (isHidden) {
      panel.removeAttribute('hidden');
      input.focus();
    } else {
      panel.setAttribute('hidden', 'true');
    }
  });

  sendBtn.addEventListener('click', () => {
    sendBotMessage();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendBotMessage();
    }
  });
}

/**
 * Отправить сообщение боту из инпута.
 */
function sendBotMessage() {
  const input = document.getElementById('bot-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  appendBotMessage('user', text);
  input.value = '';

  // Имитация "подумал"
  setTimeout(() => {
    const reply = getBotReply(text);
    appendBotMessage('bot', reply);
  }, 300);
}

/**
 * Добавить сообщение в окно бота.
 * @param {'user'|'bot'} author
 * @param {string} text
 */
function appendBotMessage(author, text) {
  const box = document.getElementById('bot-messages');
  if (!box) return;

  const row = document.createElement('div');
  row.className = 'bot-msg bot-msg--' + author;

  const bubble = document.createElement('div');
  bubble.className = 'bot-msg__bubble';
  bubble.textContent = text;

  row.appendChild(bubble);
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

/**
 * Простейшая "ИИ"-логика по ключевым словам.
 * @param {string} text
 * @returns {string}
 */
function getBotReply(text) {
  const q = text.toLowerCase();

  if (q.includes('доставка') || q.includes('курьер')) {
    return 'Доставка организуется продавцом или курьером. Сроки и стоимость зависят от локации, спросите об этом в чате с продавцом.';
  }

  if (q.includes('скидк') || q.includes('акци')) {
    return 'Товары со скидкой отмечены бейджем "Sale" и фильтруются чекбоксом "Только со скидкой". Также вы можете уточнить индивидуальные условия у продавца.';
  }

  if (q.includes('минимальн') && q.includes('заказ')) {
    return 'Минимальная сумма заказа зависит от продавца. Используйте фильтры по цене, чтобы подобрать нужный объём, и смотрите описание товара.';
  }

  if (q.includes('категор') || q.includes('что купить')) {
    return 'Выберите категорию (мясо, молочные продукты, ягоды, готовые блюда) и задайте диапазон цены. Я рекомендую начинать с самых популярных позиций в каталоге.';
  }

  if (q.includes('профил') || q.includes('кабинет')) {
    return 'В личном кабинете вы можете заполнить профиль, управлять объявлениями и отслеживать заказы. Переключайте роли "Покупатель / Продавец / Курьер" во вкладках.';
  }

  return 'Я бот-помощник Yakutia Local. Могу подсказать про доставку, скидки, категории и работу кабинета. Сформулируйте вопрос чуть подробнее.';
}

// Запуск бота после загрузки DOM
document.addEventListener('DOMContentLoaded', initBotWidget);
