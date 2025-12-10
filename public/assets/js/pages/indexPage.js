// В indexPage.js

async function submitOrder() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Для оформления заказа нужно войти в аккаунт!');
        // Тут можно открыть модалку входа
        return;
    }

    const cartItems = getCartItems(); // Твоя функция из cart.js
    if (cartItems.length === 0) return;

    // Считаем сумму
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cartItems,
                total: total
            })
        });

        if (response.ok) {
            alert('Заказ успешно оформлен! Продавец свяжется с вами.');
            localStorage.removeItem('yakutia_cart'); // Очистить корзину
            updateCartUI(); // Обновить виджет (сделать 0)
            closeCart(); // Закрыть модалку
        } else {
            alert('Ошибка при создании заказа');
        }
    } catch (e) {
        console.error(e);
        alert('Сервер недоступен');
    }
}

// Не забудь привязать это к кнопке "Оформить"
document.querySelector('.modal__footer .button--primary').addEventListener('click', submitOrder);
