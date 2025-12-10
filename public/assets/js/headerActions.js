// headerActions.js — клики по кнопкам в шапке

document.addEventListener('DOMContentLoaded', () => {
  const cartBtn = document.getElementById('cart-button');
  const ordersBtn = document.getElementById('orders-button');
  const cabinetBtn = document.getElementById('cabinet-button');
  const loginBtn = document.getElementById('login-button');
  const registerBtn = document.getElementById('register-button');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.add('modal--open');
    });
  }

  if (ordersBtn) {
    ordersBtn.addEventListener('click', () => {
      const modal = document.getElementById('orders-modal');
      if (modal) modal.classList.add('modal--open');
    });
  }

  if (cabinetBtn) {
    cabinetBtn.addEventListener('click', () => {
      window.location.href = './Cabinet.html';
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      alert('Здесь будет форма логина (демо).');
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      alert('Здесь будет форма регистрации (демо).');
    });
  }
});
