// ===== АВТОРИЗАЦИЯ CEF =====

console.log('[Auth CEF] Скрипт загружен');

// Проверка mp
function callClient(eventName, ...args) {
    console.log('[Auth CEF] Вызов:', eventName, args);
    
    if (typeof mp !== 'undefined' && mp.trigger) {
        try {
            mp.trigger(eventName, ...args);
            console.log('[Auth CEF] mp.trigger успешно');
            return true;
        } catch (err) {
            console.error('[Auth CEF] Ошибка mp.trigger:', err);
        }
    }
    
    // Альтернативный способ
    if (typeof mp !== 'undefined' && mp.events && mp.events.call) {
        try {
            mp.events.call(eventName, ...args);
            console.log('[Auth CEF] mp.events.call успешно');
            return true;
        } catch (err) {
            console.error('[Auth CEF] Ошибка mp.events.call:', err);
        }
    }
    
    console.error('[Auth CEF] mp недоступен!');
    return false;
}

// Переключение на форму регистрации
function switchToRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    hideMessage();
    document.getElementById('registerUsername').focus();
}

// Переключение на форму входа
function switchToLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    hideMessage();
    document.getElementById('loginUsername').focus();
}

// Показать сообщение
function showMessage(type, text) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
    messageEl.classList.remove('hidden');
}

// Скрыть сообщение
function hideMessage() {
    const messageEl = document.getElementById('message');
    messageEl.classList.add('hidden');
}

// Обработка входа
function handleLogin() {
    console.log('[Auth CEF] handleLogin вызвана');
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('[Auth CEF] Логин:', username, 'Пароль:', password ? '[есть]' : '[пусто]');
    
    if (!username) {
        showMessage('error', 'Введите логин');
        return;
    }
    
    if (!password) {
        showMessage('error', 'Введите пароль');
        return;
    }
    
    showMessage('info', 'Выполняется вход...');
    
    const success = callClient('cef:login', username, password);
    
    if (!success) {
        showMessage('error', 'Ошибка подключения к игре. Перезайдите.');
    }
}

// Обработка регистрации
function handleRegister() {
    console.log('[Auth CEF] handleRegister вызвана');
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (!username) {
        showMessage('error', 'Введите логин');
        return;
    }
    
    if (username.length < 3) {
        showMessage('error', 'Логин дол��ен содержать минимум 3 символа');
        return;
    }
    
    if (!password) {
        showMessage('error', 'Введите пароль');
        return;
    }
    
    if (password.length < 6) {
        showMessage('error', 'Пароль должен содержать минимум 6 символов');
        return;
    }
    
    if (password !== passwordConfirm) {
        showMessage('error', 'Пароли не совпадают');
        return;
    }
    
    showMessage('info', 'Регистрация...');
    
    const success = callClient('cef:register', username, password);
    
    if (!success) {
        showMessage('error', 'Ошибка подключения к игре. Перезайдите.');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Auth CEF] DOM загружен');
    console.log('[Auth CEF] mp доступен:', typeof mp !== 'undefined');
    
    // Кнопка входа
    const loginBtn = document.querySelector('#loginForm .btn-primary');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Auth CEF] Клик по кнопке Войти');
            handleLogin();
        });
        console.log('[Auth CEF] Обработчик кнопки входа установлен');
    }
    
    // Кнопка регистрации
    const registerBtn = document.querySelector('#registerForm .btn-primary');
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Auth CEF] Клик по кнопке Регистрация');
            handleRegister();
        });
        console.log('[Auth CEF] Обработчик кнопки регистрации установлен');
    }
    
    // Enter в полях ввода
    const loginInputs = document.querySelectorAll('#loginForm input');
    loginInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin();
            }
        });
    });
    
    const registerInputs = document.querySelectorAll('#registerForm input');
    registerInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRegister();
            }
        });
    });
    
    // Фокус на поле логина
    setTimeout(() => {
        const loginInput = document.getElementById('loginUsername');
        if (loginInput) {
            loginInput.focus();
        }
    }, 300);
    
    console.log('[Auth CEF] Инициализация завершена');
});

// Лог всех кликов для отладки
document.addEventListener('click', (e) => {
    console.log('[Auth CEF] Клик по элементу:', e.target.tagName, e.target.className);
});