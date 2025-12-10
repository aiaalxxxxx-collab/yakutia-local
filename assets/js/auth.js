/**
 * auth.js — Логика входа и регистрации
 */
const API_URL = 'http://localhost:3000/api/auth';

// Переключение вкладок
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const errorMsg = document.getElementById('error-message');

    errorMsg.style.display = 'none';

    if (tab === 'login') {
        loginForm.hidden = false;
        registerForm.hidden = true;
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.hidden = true;
        registerForm.hidden = false;
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

// Утилита показа ошибки
function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = msg;
    el.style.display = 'block';
}

// 1. ЛОГИН
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const oldText = btn.textContent;
    btn.textContent = 'Вход...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // УСПЕХ: Сохраняем токен и редирект
            localStorage.setItem('token', result.token);
            localStorage.setItem('user_role', result.user.role);
            window.location.href = 'Cabinet.html'; // Сразу в кабинет
        } else {
            showError(result.detail || 'Неверный email или пароль');
        }
    } catch (err) {
        showError('Ошибка сервера. Проверьте соединение.');
    } finally {
        btn.textContent = oldText;
        btn.disabled = false;
    }
});

// 2. РЕГИСТРАЦИЯ
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const oldText = btn.textContent;
    btn.textContent = 'Создание...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // УСПЕХ: Сразу входим
            localStorage.setItem('token', result.token);
            localStorage.setItem('user_role', result.user.role);
            alert('Регистрация успешна!');
            window.location.href = 'Cabinet.html';
        } else {
            showError(result.detail || 'Ошибка регистрации (возможно, email занят)');
        }
    } catch (err) {
        showError('Ошибка сервера.');
    } finally {
        btn.textContent = oldText;
        btn.disabled = false;
    }
});
