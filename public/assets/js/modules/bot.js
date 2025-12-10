/**
 * bot.js — Умный помощник (Smart Helper)
 */
function initBotWidget() {
    const toggleBtn = document.getElementById('bot-toggle');
    const panel = document.getElementById('bot-panel');
    const input = document.getElementById('bot-input');
    const sendBtn = document.getElementById('bot-send');

    if (!toggleBtn || !panel) return;

    toggleBtn.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        if(!panel.hidden) input.focus();
    });

    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;
        
        addMessage('user', text);
        input.value = '';

        // Имитация мышления ИИ
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            const reply = generateSmartReply(text);
            addMessage('bot', reply);
        }, 800);
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendMessage(); });
}

function addMessage(sender, text) {
    const container = document.getElementById('bot-messages');
    const div = document.createElement('div');
    div.className = `bot-msg bot-msg--${sender}`;
    div.innerHTML = `<div class="bot-msg__bubble">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
    const container = document.getElementById('bot-messages');
    const div = document.createElement('div');
    div.id = 'bot-typing';
    div.className = 'bot-msg bot-msg--bot';
    div.innerHTML = '<div class="bot-msg__bubble">...</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById('bot-typing');
    if(el) el.remove();
}

// "МОЗГИ" БОТА
function generateSmartReply(text) {
    const q = text.toLowerCase();
    
    if (q.includes('привет') || q.includes('здравствуй')) 
        return 'Привет! Я виртуальный помощник Якутии. Чем могу помочь?';
    
    if (q.includes('доставк') || q.includes('курьер')) 
        return 'У нас работает доставка курьерами (авто/пешие) или самовывоз. Выберите опцию при оформлении заказа.';
    
    if (q.includes('продав') || q.includes('торгова')) 
        return 'Чтобы стать продавцом, зарегистрируйтесь и в личном кабинете выберите роль "Продавец". Это бесплатно!';
    
    if (q.includes('скидк') || q.includes('акци')) 
        return 'Ищите товары с красным бейджиком "Sale". Сейчас скидки на ягоды и рыбу!';
    
    if (q.includes('хакатон') || q.includes('команд')) 
        return 'Наша команда настроена на победу! Мы реализовали чат, корзину, админку и мультиязычность. Мы молодцы!';

    return 'Я пока учусь и не понял вопрос. Попробуйте спросить про доставку, товары или скидки.';
}

document.addEventListener('DOMContentLoaded', initBotWidget);
