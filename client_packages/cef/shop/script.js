// ===== СИСТЕМА МАГАЗИНА (CEF) =====

let shopData = null;
let playerData = null;
let cart = [];
let currentCategory = 'all';

const CATEGORY_ICONS = {
    'consumable': 'fa-utensils',
    'medical': 'fa-medkit',
    'weapon': 'fa-gun',
    'ammo': 'fa-crosshairs',
    'clothing': 'fa-tshirt',
    'tool': 'fa-wrench',
    'electronics': 'fa-mobile-alt',
    'default': 'fa-box'
};

const SHOP_ICONS = {
    'general': 'fa-store',
    'clothing': 'fa-tshirt',
    'weapon': 'fa-gun',
    'gasstation': 'fa-gas-pump'
};

// ===== ЗАГРУЗКА МАГАЗИНА =====
function loadShop(shopJson, playerJson) {
    try {
        shopData = JSON.parse(shopJson);
        playerData = JSON.parse(playerJson);
        
        // Заголовок
        document.getElementById('shopName').textContent = shopData.name;
        document.getElementById('shopIcon').className = `fas ${SHOP_ICONS[shopData.type] || 'fa-store'}`;
        
        // Баланс
        updateBalance(playerJson);
        
        // Категории
        renderCategories();
        
        // Товары
        renderProducts();
        
        // Показываем панель заправки если это заправка
        if (shopData.type === 'gasstation') {
            document.getElementById('refuelPanel').style.display = 'block';
            setupFuelSlider();
        }
        
    } catch (err) {
        console.error('[Shop] Ошибка загрузки:', err);
    }
}

// ===== КАТЕГОРИИ =====
function renderCategories() {
    const container = document.getElementById('categories');
    
    // Получаем уникальные типы товаров
    const types = [...new Set(shopData.products.map(p => p.type))];
    
    let html = `<button class="category-btn active" onclick="filterCategory('all')">Все</button>`;
    
    types.forEach(type => {
        const icon = CATEGORY_ICONS[type] || CATEGORY_ICONS.default;
        const name = getCategoryName(type);
        html += `<button class="category-btn" onclick="filterCategory('${type}')">
            <i class="fas ${icon}"></i> ${name}
        </button>`;
    });
    
    container.innerHTML = html;
}

function getCategoryName(type) {
    const names = {
        'consumable': 'Еда и напитки',
        'medical': 'Медикаменты',
        'weapon': 'Оружие',
        'ammo': 'Патроны',
        'clothing': 'Одежда',
        'tool': 'Инструменты',
        'electronics': 'Электроника'
    };
    return names[type] || type;
}

function filterCategory(type) {
    currentCategory = type;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(getCategoryName(type)) || (type === 'all' && btn.textContent === 'Все')) {
            btn.classList.add('active');
        }
    });
    
    renderProducts();
}

// ===== ТОВАРЫ =====
function renderProducts() {
    const container = document.getElementById('productsGrid');
    
    let products = shopData.products;
    if (currentCategory !== 'all') {
        products = products.filter(p => p.type === currentCategory);
    }
    
    if (products.length === 0) {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; grid-column: 1/-1; padding: 50px;">Нет товаров в этой категории</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="addToCart(${product.id})">
            <div class="product-icon">
                ${getProductIcon(product)}
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price ${product.discount > 0 ? 'discount' : ''}">
                ${product.discount > 0 ? `<span class="original">$${product.price}</span>` : ''}
                $${product.finalPrice}
            </div>
        </div>
    `).join('');
}

function getProductIcon(product) {
    if (product.icon) {
        return `<img src="${product.icon}" alt="" style="width: 40px; height: 40px;">`;
    }
    
    const icon = CATEGORY_ICONS[product.type] || CATEGORY_ICONS.default;
    return `<i class="fas ${icon}" style="color: #4CAF50;"></i>`;
}

// ===== КОРЗИНА =====
function addToCart(productId) {
    const product = shopData.products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(c => c.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.finalPrice,
            quantity: 1
        });
    }
    
    renderCart();
    showNotification('success', `${product.name} добавлен в корзину`);
}

function removeFromCart(productId) {
    cart = cart.filter(c => c.id !== productId);
    renderCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(c => c.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        renderCart();
    }
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 30px;">Корзина пуста</div>';
        countEl.textContent = '0';
        totalEl.textContent = '$0';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price} × ${item.quantity}</div>
            </div>
            <div class="cart-item-qty">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <i class="fas fa-trash cart-item-remove" onclick="removeFromCart(${item.id})"></i>
        </div>
    `).join('');
    
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    countEl.textContent = totalCount;
    totalEl.textContent = `$${totalPrice.toLocaleString()}`;
}

// ===== ОФОРМЛЕНИЕ ПОКУПКИ =====
function checkout() {
    if (cart.length === 0) {
        showNotification('error', 'Корзина пуста');
        return;
    }
    
    const paymentType = document.getElementById('paymentType').value;
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Проверяем баланс
    const balance = paymentType === 'bank' ? playerData.bank : playerData.cash;
    if (balance < totalPrice) {
        showNotification('error', 'Недостаточно средств');
        return;
    }
    
    // Отправляем каждый товар на сервер
    cart.forEach(item => {
        mp.trigger('cef:buyItem', item.id, item.quantity, paymentType);
    });
    
    // Очищаем корзину
    cart = [];
    renderCart();
}

// ===== ЗАПРАВКА =====
function setupFuelSlider() {
    const slider = document.getElementById('fuelAmount');
    const display = document.getElementById('fuelDisplay');
    const price = document.getElementById('fuelPrice');
    const pricePerLiter = 3;
    
    slider.addEventListener('input', () => {
        const amount = slider.value;
        display.textContent = `${amount}л`;
        price.textContent = `$${amount * pricePerLiter}`;
    });
}

function refuel() {
    const amount = document.getElementById('fuelAmount').value;
    mp.trigger('cef:refuel', amount);
}

// ===== БАЛАНС =====
function updateBalance(balanceJson) {
    try {
        const data = typeof balanceJson === 'string' ? JSON.parse(balanceJson) : balanceJson;
        playerData = { ...playerData, ...data };
        
        document.getElementById('cashBalance').textContent = `$${(data.cash || 0).toLocaleString()}`;
        document.getElementById('bankBalance').textContent = `$${(data.bank || 0).toLocaleString()}`;
    } catch (err) {
        console.error('[Shop] Ошибка обновления баланса:', err);
    }
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(type, message) {
    const container = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== ЗАКРЫТИЕ =====
function closeShop() {
    mp.trigger('cef:closeShop');
}

// ESC для закрытия
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeShop();
    }
});