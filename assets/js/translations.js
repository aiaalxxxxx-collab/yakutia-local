/**
 * translations.js — Система перевода (i18n)
 */
const dictionary = {
    ru: {
        header_find: "Найдите продукты Якутии",
        header_desc: "Местные продукты от производителей.",
        btn_cart: "Тележка",
        btn_orders: "Мои заказы",
        btn_login: "Войти",
        cat_all: "Все категории",
        price_from: "от",
        price_to: "до",
        btn_apply: "Применять",
        section_private: "Объявления мастеров",
        section_brands: "Крупные производители",
        footer_copy: "© Якутия Местная. Все права защищены.",
        modal_cart_title: "Моя корзина",
        btn_checkout: "Оформить заказ",
        empty_cart: "Корзина пуста"
    },
    en: {
        header_find: "Find Yakutia Products",
        header_desc: "Local products from manufacturers.",
        btn_cart: "Cart",
        btn_orders: "My Orders",
        btn_login: "Login",
        cat_all: "All Categories",
        price_from: "from",
        price_to: "to",
        btn_apply: "Apply",
        section_private: "Private Masters",
        section_brands: "Major Producers",
        footer_copy: "© Yakutia Local. All rights reserved.",
        modal_cart_title: "My Cart",
        btn_checkout: "Checkout",
        empty_cart: "Cart is empty"
    },
    sakha: {
        header_find: "Саха Сирин астара",
        header_desc: "Олохтоох оҥорооччулартан.",
        btn_cart: "Карзинка",
        btn_orders: "Мин сакаастарым",
        btn_login: "Киир",
        cat_all: "Бары категориялар",
        price_from: "от",
        price_to: "до",
        btn_apply: "Тут",
        section_private: "Маастардар биллэриилэрэ",
        section_brands: "Улахан тэрилтэлэр",
        footer_copy: "© Саха Сирэ. Бары быраап көмүскэллээх.",
        modal_cart_title: "Мин карзинкам",
        btn_checkout: "Сакаастыыр",
        empty_cart: "Кураанах"
    }
};

function changeLanguage(lang) {
    // Сохраняем выбор
    localStorage.setItem('yakutia_lang', lang);
    
    // Ищем все элементы с атрибутом data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang] && dictionary[lang][key]) {
            el.textContent = dictionary[lang][key];
        }
    });

    // Обновляем плейсхолдеры
    if(lang === 'en') {
        document.querySelector('input[placeholder="Поиск товаров..."]')?.setAttribute('placeholder', 'Search products...');
    } else {
        document.querySelector('input[placeholder="Search products..."]')?.setAttribute('placeholder', 'Поиск товаров...');
    }
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('yakutia_lang') || 'ru';
    const selector = document.getElementById('lang-selector');
    if (selector) {
        selector.value = savedLang;
        selector.addEventListener('change', (e) => changeLanguage(e.target.value));
    }
    changeLanguage(savedLang);
});
