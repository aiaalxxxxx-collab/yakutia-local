// i18n.js — простая клиентская локализация для RU / EN / ZH

const I18N_STORAGE_KEY = 'yakutia_lang';
const I18N_SUPPORTED = ['ru', 'en', 'zh'];

let currentLang = getSavedLang() || 'ru';
let translationsCache = {};

/**
 * Получить сохранённый язык из localStorage или по браузеру.
 */
function getSavedLang() {
  const saved = localStorage.getItem(I18N_STORAGE_KEY);
  if (saved && I18N_SUPPORTED.includes(saved)) return saved;

  const browser = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return I18N_SUPPORTED.includes(browser) ? browser : 'ru';
}

/**
 * Установить язык и применить переводы.
 * @param {'ru'|'en'|'zh'} lang
 */
async function setLanguage(lang) {
  if (!I18N_SUPPORTED.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem(I18N_STORAGE_KEY, lang);

  // Подставим в селект, если он есть
  const select = document.getElementById('language-select');
  if (select) {
    select.value = lang;
  }

  const dict = await loadTranslations(lang);
  applyTranslations(dict);
}

/**
 * Загрузить JSON с переводами для языка (кэшируем).
 * @param {string} lang
 * @returns {Promise<object>}
 */
async function loadTranslations(lang) {
  if (translationsCache[lang]) return translationsCache[lang];

  const res = await fetch(`./assets/i18n/${lang}.json`);
  const data = await res.json();
  translationsCache[lang] = data;
  return data;
}

/**
 * Получить строку по ключу вида "header.logo".
 * @param {object} dict
 * @param {string} key
 * @returns {string|null}
 */
function resolveKey(dict, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return acc[part];
    }
    return null;
  }, dict);
}

/**
 * Применить переводы ко всем элементам с data-i18n и data-i18n-placeholder.
 * Меняет и короткие подписи, и целые предложения.
 * @param {object} dict
 */
function applyTranslations(dict) {
  // Текстовые узлы
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const value = resolveKey(dict, key);
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });

  // Плейсхолдеры
  document
    .querySelectorAll('[data-i18n-placeholder]')
    .forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const value = resolveKey(dict, key);
      if (typeof value === 'string') {
        el.setAttribute('placeholder', value);
      }
    });

  // Атрибут title, если понадобится
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    const value = resolveKey(dict, key);
    if (typeof value === 'string') {
      el.setAttribute('title', value);
    }
  });
}

/**
 * Инициализация переключателя языков.
 */
function initLanguageSwitcher() {
  const select = document.getElementById('language-select');
  if (select) {
    select.innerHTML = `
      <option value="ru">RU</option>
      <option value="en">EN</option>
      <option value="zh">中文</option>
    `;
    select.value = currentLang;

    select.addEventListener('change', () => {
      setLanguage(select.value);
    });
  }

  // Применяем язык при первой загрузке
  setLanguage(currentLang);
}

document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
