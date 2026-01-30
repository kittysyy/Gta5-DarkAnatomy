// ===== МАГАЗИН ОДЕЖДЫ =====

let shopData = null;
let playerData = null;
let cart = [];
let currentCategory = 'all';
let selectedProduct = null;

const CLOTHING_CATEGORIES = {
    'tops': ['футболка', 'рубашка', 'куртка', 'пиджак', 'свитер', 'майка', 'толстовка', 'жилет', 'пальто', 'hoodie', 'jacket', 'shirt', 'tank'],
    'pants': ['джинсы', 'штаны', 'брюки', 'шорты', 'jeans', 'pants', 'shorts'],
    'shoes': ['кроссовки', 'ботинки', 'туфли', 'сандалии', 'кеды', 'обувь', 'shoes', 'boots', 'sneakers'],
    'accessories': ['очки', 'часы', 'цепочка', 'браслет', 'перчатки', 'glasses', 'watch'],
    'hats': ['шапка', 'кепка', 'шляпа', 'бандана', 'берет', 'шлем', 'hat', 'cap', 'beanie'],
    'masks': ['маска', 'балаклава', 'респиратор', 'mask'],
    'bags': ['рюкзак', 'сумка', 'backpack', 'bag']
};

const CATEGORY_ICONS = {
    'tops': 'fa-tshirt',
    'pants': 'fa-socks',
    'shoes': 'fa-shoe-prints',
    'accessories': 'fa-glasses',
    'hats': 'fa-hat-cowboy',
    'masks': 'fa-mask',
    'bags': 'fa-briefcase',
    'all': 'fa-th'
};

// ===== ЗАГРУЗКА =====
function loadShop(shopJson, playerJson) {
    try {
        shopData = JSON.parse(shopJson);
        playerData = JSON.parse(playerJson);
        
        document.getElementById('shopName').textContent = shopData.name;
        updateBalance(playerJson);
        
        shopData.products.forEach(product => {
            product.clothingCategory = detectClothingCategory(product.name);
        });
        
        renderProducts();
        setupCategoryHandlers();
        
        console.log('[Shop] Загружено товаров:', shopData.products.length);
        
    } catch (err) {
        console.error('[Shop] Ошибка загрузки:', err);
    }
}

function detectClothingCategory(productName) {
    const name = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CLOTHING_CATEGORIES)) {
        for (const keyword of keywords) {
            if (name.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }
    return 'accessories';
}

function setupCategoryHandlers() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderProducts();
        });
    });
}

// ===== РЕНДЕР ТОВАРОВ =====
function renderProducts() {
    const container = document.getElementById('productsGrid');
    
    let products = shopData.products;
    if (currentCategory !== 'all') {
        products = products.filter(p => p.clothingCategory === currentCategory);
    }
    
    if (products.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.4); padding: 40px;">Нет товаров</div>`;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card ${selectedProduct && selectedProduct.id === product.id ? 'selected' : ''}" 
             data-id="${product.id}">
            <div class="product-icon">
                <i class="fas ${getCategoryIcon(product.clothingCategory)}"></i>
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.finalPrice.toLocaleString()}</div>
        </div>
    `).join('');
    
    // Добавляем обработчики кликов
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            selectProduct(productId);
        });
        
        card.addEventListener('dblclick', function() {
            const productId = parseInt(this.dataset.id);
            addToCart(productId);
        });
    });
}

function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || 'fa-tshirt';
}

// ===== ВЫБОР ТОВАРА =====
function selectProduct(productId) {
    const product = shopData.products.find(p => p.id === productId);
    if (!product) return;
    
    selectedProduct = product;
    
    // Обновляем выделение
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('selected');
        if (parseInt(card.dataset.id) === productId) {
            card.classList.add('selected');
        }
    });
    
    // Показываем панель с кнопками
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('selectedContent').classList.add('active');
    
    // Заполняем данные
    document.getElementById('selectedName').textContent = product.name;
    document.getElementById('selectedPrice').textContent = `$${product.finalPrice.toLocaleString()}`;
    document.getElementById('selectedIcon').innerHTML = `<i class="fas ${getCategoryIcon(product.clothingCategory)}"></i>`;
    
    console.log('[Shop] Выбран товар:', product.name, 'itemId:', product.itemId);
}

// ===== ПРИМЕРКА =====
function tryOnItem() {
    if (!selectedProduct) {
        showNotification('error', 'Сначала выберите товар!');
        return;
    }
    
    console.log('[Shop] Примерка:', selectedProduct.name, 'itemId:', selectedProduct.itemId);
    
    mp.trigger('cef:tryClothing', selectedProduct.itemId);
    showNotification('success', `Примерка: ${selectedProduct.name}`);
}

// ===== КОРЗИНА =====
function addSelectedToCart() {
    if (selectedProduct) {
        addToCart(selectedProduct.id);
    } else {
        showNotification('error', 'Сначала выберите товар!');
    }
}

function addToCart(productId) {
    const product = shopData.products.find(p => p.id === productId);
    if (!product) return;
    
    if (cart.find(c => c.id === productId)) {
        showNotification('error', 'Товар уже в корзине');
        return;
    }
    
    cart.push({
        id: product.id,
        itemId: product.itemId,
        name: product.name,
        price: product.finalPrice,
        category: product.clothingCategory
    });
    
    renderCart();
    showNotification('success', `${product.name} добавлен в корзину`);
}

function removeFromCart(productId) {
    cart = cart.filter(c => c.id !== productId);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty">Корзина пуста</div>';
        countEl.textContent = '0';
        totalEl.textContent = '$0';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-icon"><i class="fas ${getCategoryIcon(item.category)}"></i></div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toLocaleString()}</div>
            </div>
            <i class="fas fa-trash cart-item-remove" onclick="removeFromCart(${item.id})"></i>
        </div>
    `).join('');
    
    countEl.textContent = cart.length;
    totalEl.textContent = `$${cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()}`;
}


// ===== ВРАЩЕНИЕ КАМЕРЫ =====
function rotateLeft() {
    mp.trigger('cef:rotateCameraLeft');
}

function rotateRight() {
    mp.trigger('cef:rotateCameraRight');
}

function resetRotation() {
    mp.trigger('cef:resetRotation');
}

// ===== ПОКУПКА =====
function checkout() {
    if (cart.length === 0) {
        showNotification('error', 'Корзина пуста');
        return;
    }
    
    const paymentType = document.getElementById('paymentType').value;
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const balance = paymentType === 'bank' ? playerData.bank : playerData.cash;
    
    if (balance < totalPrice) {
        showNotification('error', 'Недостаточно средств');
        return;
    }
    
    cart.forEach(item => {
        mp.trigger('cef:buyItem', item.id, 1, paymentType);
    });
    
    cart = [];
    renderCart();
    showNotification('success', 'Покупка оформлена!');
}

// ===== БАЛАНС =====
function updateBalance(balanceJson) {
    try {
        const data = typeof balanceJson === 'string' ? JSON.parse(balanceJson) : balanceJson;
        playerData = { ...playerData, ...data };
        document.getElementById('cashBalance').textContent = `$${(data.cash || 0).toLocaleString()}`;
        document.getElementById('bankBalance').textContent = `$${(data.bank || 0).toLocaleString()}`;
    } catch (err) {}
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(type, message) {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ===== ЗАКРЫТИЕ =====
function closeShop() {
    mp.trigger('cef:resetClothing');
    mp.trigger('cef:closeShop');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShop();
});

console.log('[Shop CEF] Скрипт загружен');