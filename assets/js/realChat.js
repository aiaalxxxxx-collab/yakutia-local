/**
 * realChat.js — Чат с продавцом (открывается из карточки товара)
 */
const CHAT_API = 'http://localhost:3000/api/chats';
let currentProductId = null;

async function openChatWithSeller(productId, productTitle) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Чтобы написать продавцу, нужно войти в аккаунт!');
        return;
    }

    currentProductId = productId;
    
    // Открываем модалку чата
    const modal = document.getElementById('chat-modal');
    const title = document.getElementById('chat-product-title');
    const messagesBox = document.getElementById('chat-messages');
    
    if (modal) {
        modal.hidden = false;
        if(title) title.textContent = productTitle;
        if(messagesBox) messagesBox.innerHTML = '<p>Загрузка переписки...</p>';
        
        // Загружаем историю
        await loadChatHistory(productId);
    }
}

async function loadChatHistory(productId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${CHAT_API}/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();
        renderMessages(messages);
    } catch (e) {
        console.error(e);
    }
}

function renderMessages(messages) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    
    if (!messages || messages.length === 0) {
        box.innerHTML = '<p style="color:#999; text-align:center">Напишите первое сообщение...</p>';
        return;
    }

    box.innerHTML = messages.map(msg => {
        const isMe = msg.authorId == getCurrentUserId(); // Нужна функция ID
        return `
            <div style="text-align: ${isMe ? 'right' : 'left'}; margin: 5px 0;">
                <span style="background: ${isMe ? '#dbeafe' : '#f3f4f6'}; padding: 5px 10px; border-radius: 10px; display: inline-block;">
                    ${msg.text}
                </span>
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input-field');
    const text = input.value.trim();
    if (!text || !currentProductId) return;

    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${CHAT_API}/${currentProductId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });
        
        if (res.ok) {
            input.value = '';
            loadChatHistory(currentProductId);
        }
    } catch (e) {
        alert('Ошибка отправки');
    }
}

// Хелпер для получения ID (грубо из токена)
function getCurrentUserId() {
    const token = localStorage.getItem('token');
    if(!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch { return null; }
}

// Инициализация кнопок
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('chat-send-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const modal = document.getElementById('chat-modal');
    
    if(sendBtn) sendBtn.addEventListener('click', sendChatMessage);
    if(closeBtn) closeBtn.addEventListener('click', () => modal.hidden = true);
});
