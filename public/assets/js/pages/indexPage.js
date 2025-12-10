const searchInput = document.getElementById('search-input'); // Твой инпут поиска

let timeoutId;
searchInput.addEventListener('input', (e) => {
    // Сбрасываем таймер при каждом нажатии клавиши
    clearTimeout(timeoutId);
    
    // Ждем 300мс, пока юзер закончит печатать
    timeoutId = setTimeout(() => {
        const query = e.target.value.toLowerCase();
        filterProducts(query); // Твоя функция фильтрации
    }, 300);
});

function filterProducts(query) {
    // Пример фильтрации
    const allCards = document.querySelectorAll('.product-card');
    allCards.forEach(card => {
        const title = card.querySelector('.product-card__title').textContent.toLowerCase();
        if (title.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}
