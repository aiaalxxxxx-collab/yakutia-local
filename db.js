/**
 * db.js — Надежный движок JSON-базы с транзакциями и блокировками
 */
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Очередь блокировок: { 'path/to/file.json': Promise }
const locks = new Map();

/**
 * Умная функция блокировки.
 * Если файл занят другой операцией, она ставит текущую в очередь.
 */
function acquireLock(filePath) {
    let previousLock = locks.get(filePath) || Promise.resolve();
    
    let release;
    const currentLock = new Promise(resolve => {
        release = resolve;
    });

    // Новая блокировка ждет завершения предыдущей, затем выполняется сама
    const chain = previousLock.then(() => release);
    
    // Обновляем хвост очереди
    locks.set(filePath, chain);

    // Возвращаем функцию, которую нужно вызвать, когда мы закончим работу с файлом
    return async () => {
        // Ждем, пока предыдущие операции закончатся (на всякий случай)
        await previousLock; 
        return release; 
    };
}

const db = {
    /**
     * Читает данные (безопасно)
     */
    async read(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            // Если файла нет — вернем пустой массив (как при старте)
            if (err.code === 'ENOENT') return [];
            throw err;
        }
    },

    /**
     * Атомарная запись с блокировкой (ТРАНЗАКЦИЯ)
     * 1. Блокирует файл для других запросов.
     * 2. Пишет во временный файл.
     * 3. Переименовывает временный в основной (атомарная операция ОС).
     * 4. Снимает блокировку.
     */
    async write(filePath, data) {
        const waitUnlock = await acquireLock(filePath);
        const unlock = await waitUnlock(); // Ждем своей очереди

        const tempPath = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        
        try {
            const json = JSON.stringify(data, null, 2);
            
            // 1. Пишем во временный файл (если тут упадет свет, основной файл цел)
            await fs.writeFile(tempPath, json, 'utf8');
            
            // 2. Атомарное переименование (мгновенная замена старого файла новым)
            await fs.rename(tempPath, filePath);
            
        } catch (err) {
            console.error(`❌ Ошибка записи в ${filePath}:`, err);
            // Пытаемся почистить мусор
            try { await fs.unlink(tempPath); } catch (e) {}
            throw err;
        } finally {
            // Всегда освобождаем очередь, даже при ошибке
            unlock(); 
        }
    },

    /**
     * UPDATE-Транзакция: прочитать -> изменить -> записать
     * Гарантирует, что между чтением и записью никто не вклинится.
     * 
     * @param {string} filePath - Путь к файлу
     * @param {function(Array): Array} callback - Функция, меняющая данные
     */
    async update(filePath, callback) {
        const waitUnlock = await acquireLock(filePath);
        const unlock = await waitUnlock(); // Захватываем файл целиком

        const tempPath = `${filePath}.tmp-${Date.now()}`;

        try {
            // 1. Читаем актуальные данные ПРЯМО СЕЙЧАС (внутри лока)
            let currentData;
            try {
                const raw = await fs.readFile(filePath, 'utf8');
                currentData = JSON.parse(raw);
            } catch (err) {
                if (err.code === 'ENOENT') currentData = [];
                else throw err;
            }

            // 2. Применяем изменения
            const newData = callback(currentData);
            
            // Валидация: если callback ничего не вернул, ошибка кода
            if (newData === undefined) throw new Error('Transaction failed: update callback returned undefined');

            // 3. Пишем и подменяем
            await fs.writeFile(tempPath, JSON.stringify(newData, null, 2), 'utf8');
            await fs.rename(tempPath, filePath);
            
            return newData; // Возвращаем обновленные данные
        } catch (err) {
            try { await fs.unlink(tempPath); } catch (e) {}
            throw err;
        } finally {
            unlock(); // Отпускаем файл для других
        }
    }
};

module.exports = db;
