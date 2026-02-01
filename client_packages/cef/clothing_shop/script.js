// ===== ДАННЫЕ =====
let shopData = null;
let allProducts = [];
let playerData = { cash: 0, bank: 0 };
let selectedProduct = null;
let selectedVariant = 0;
let currentCategory = null;

// Структура категорий
const CATEGORIES = {
    tops: {
        name: 'Верх',
        icon: 'fa-shirt',
        items: ['tshirt_', 'tank_', 'polo_', 'shirt_', 'hoodie_', 'jacket_', 'blazer_', 'vest_']
    },
    bottoms: {
        name: 'Низ',
        icon: 'fa-socks',
        items: ['jeans_', 'pants_', 'shorts_']
    },
    shoes: {
        name: 'Обувь',
        icon: 'fa-shoe-prints',
        items: ['shoes_']
    },
    headwear: {
        name: 'Головные уборы',
        icon: 'fa-hat-cowboy',
        items: ['hat_']
    },
    glasses: {
        name: 'Очки',
        icon: 'fa-glasses',
        items: ['glasses_']
    },
    masks: {
        name: 'Маски',
        icon: 'fa-mask',
        items: ['mask_']
    },
    accessories: {
        name: 'Аксессуары',
        icon: 'fa-gem',
        items: ['watch_']
    },
    bags: {
        name: 'Рюкзаки',
        icon: 'fa-bag-shopping',
        items: ['backpack_']
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    console.log('[ClothingShop] Инициализация завершена');
});

// ===== ОБРАБОТЧИКИ =====
function setupEventListeners() {
    // Категории
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.category;
            selectCategory(cat);
        });
    });

    // Закрытие / Назад
    document.getElementById('backBtn').addEventListener('click', closeShop);

    // Поиск
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterProducts(e.target.value);
    });

    // Покупка
    document.getElementById('btnBuy').addEventListener('click', buyItem);

    // Scroll to top
    const productsList = document.getElementById('productsList');
    productsList.addEventListener('scroll', () => {
        const btn = document.getElementById('scrollTopBtn');
        if (productsList.scrollTop > 200) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    document.getElementById('scrollTopBtn').addEventListener('click', () => {
        document.getElementById('productsList').scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeShop();
        if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') prevCategory();
        if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') nextCategory();
        if (e.key === 'ArrowLeft') prevVariant();
        if (e.key === 'ArrowRight') nextVariant();
    });
}

// ===== КАТЕГОРИИ =====
function selectCategory(catKey) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.cat-btn[data-category="${catKey}"]`);
    if (btn) btn.classList.add('active');

    currentCategory = catKey;
    loadProducts(catKey);
}

function prevCategory() {
    const keys = Object.keys(CATEGORIES);
    let idx = keys.indexOf(currentCategory);
    idx = idx <= 0 ? keys.length - 1 : idx - 1;
    selectCategory(keys[idx]);
}

function nextCategory() {
    const keys = Object.keys(CATEGORIES);
    let idx = keys.indexOf(currentCategory);
    idx = idx >= keys.length - 1 ? 0 : idx + 1;
    selectCategory(keys[idx]);
}

// ===== ЗАГРУЗКА ТОВАРОВ =====
function loadProducts(catKey) {
    const container = document.getElementById('productsList');
    container.innerHTML = '';

    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<div class="products-placeholder"><i class="fas fa-box-open"></i><span>Нет товаров</span></div>';
        return;
    }

    const category = CATEGORIES[catKey];
    if (!category) return;

    // Фильтруем товары
    const filtered = allProducts.filter(p => {
        const name = (p.itemName || p.name || '').toLowerCase();
        return category.items.some(prefix => name.startsWith(prefix));
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="products-placeholder"><i class="fas fa-box-open"></i><span>Нет товаров в этой категории</span></div>';
        return;
    }

    // Группируем по drawable
    const grouped = {};
    filtered.forEach(product => {
        const drawable = product.drawable || 0;
        const baseName = getBaseName(product.displayName || product.name);
        const key = `${baseName}_${drawable}`;

        if (!grouped[key]) {
            grouped[key] = {
                name: baseName,
                drawable: drawable,
                price: product.finalPrice || product.price,
                variants: []
            };
        }
        grouped[key].variants.push(product);
    });

    // Отображаем
    Object.values(grouped).forEach(group => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div class="product-thumb">
                <i class="fas ${category.icon}"></i>
            </div>
            <div class="product-details">
                <div class="product-name">${group.name}</div>
                <div class="product-price">$${formatPrice(group.price)}</div>
            </div>
        `;
        item.addEventListener('click', () => selectProduct(item, group));
        container.appendChild(item);
    });
}

function getBaseName(name) {
    if (!name) return 'Товар';
    return name
        .replace(/\s*\(вариант\s*\d+\)/gi, '')
        .replace(/\s*(белая|чёрная|серая|красная|синяя|зелёная|жёлтая|коричневая|розовая|фиолетовая|оранжевая|бирюзовая|золотая|серебряная|хаки|камуфляжная|светлая|тёмная|бежевая)/gi, '')
        .replace(/\s*(белый|чёрный|серый|красный|синий|зелёный|жёлтый|коричневый|розовый|фиолетовый|оранжевый|бирюзовый|золотой|серебряный)/gi, '')
        .replace(/\s*(белое|чёрное|серое|красное|синее|зелёное|жёлтое|коричневое|розовое|фиолетовое|оранжевое)/gi, '')
        .replace(/\s*(белые|чёрные|серые|красные|синие|зелёные|жёлтые|коричневые|розовые)/gi, '')
        .trim() || 'Товар';
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function filterProducts(query) {
    const items = document.querySelectorAll('.product-item');
    const q = query.toLowerCase();
    items.forEach(item => {
        const name = item.querySelector('.product-name').textContent.toLowerCase();
        item.style.display = name.includes(q) ? 'flex' : 'none';
    });
}

// ===== ВЫБОР ТОВАРА =====
function selectProduct(element, product) {
    document.querySelectorAll('.product-item').forEach(i => i.classList.remove('selected'));
    element.classList.add('selected');

    selectedProduct = product;
    selectedVariant = 0;

    showVariants(product.variants);
    document.getElementById('btnBuy').disabled = false;

    // Примеряем первый вариант
    tryOnItem(product.variants[0]);
}

function showVariants(variants) {
    const panel = document.getElementById('variantsPanel');
    const list = document.getElementById('variantsList');
    const counter = document.getElementById('variantsCounter');

    list.innerHTML = '';
    counter.textContent = `1 из ${variants.length}`;

    variants.forEach((variant, index) => {
        const btn = document.createElement('button');
        btn.className = 'variant-btn' + (index === 0 ? ' active' : '');
        btn.innerHTML = `<i class="fas fa-tshirt"></i>`;
        btn.addEventListener('click', () => selectVariant(index, variant));
        list.appendChild(btn);
    });

    panel.classList.add('show');
}

function selectVariant(index, variant) {
    document.querySelectorAll('.variant-btn').forEach((b, i) => {
        b.classList.toggle('active', i === index);
    });

    selectedVariant = index;
    document.getElementById('variantsCounter').textContent = 
        `${index + 1} из ${selectedProduct.variants.length}`;

    tryOnItem(variant);
}

function prevVariant() {
    if (!selectedProduct) return;
    const newIdx = selectedVariant > 0 ? selectedVariant - 1 : selectedProduct.variants.length - 1;
    selectVariant(newIdx, selectedProduct.variants[newIdx]);
}

function nextVariant() {
    if (!selectedProduct) return;
    const newIdx = selectedVariant < selectedProduct.variants.length - 1 ? selectedVariant + 1 : 0;
    selectVariant(newIdx, selectedProduct.variants[newIdx]);
}

// ===== ПРИМЕРКА =====
function tryOnItem(product) {
    if (typeof mp !== 'undefined') {
        mp.trigger('cef:clothingShop:tryOn', product.itemId || product.id);
    }
    console.log('[ClothingShop] Примерка:', product.itemId || product.id);
}

// ===== ПОКУПКА =====
function buyItem() {
    if (!selectedProduct) return;

    const variant = selectedProduct.variants[selectedVariant];
    const price = variant.finalPrice || variant.price;

    if (playerData.cash < price && playerData.bank < price) {
        showNotification('error', 'Недостаточно средств!');
        return;
    }

    const paymentType = playerData.cash >= price ? 'cash' : 'bank';

    if (typeof mp !== 'undefined') {
        mp.trigger('cef:clothingShop:buy', variant.productId || variant.id, 1, paymentType);
    }

    console.log('[ClothingShop] Покупка:', variant.productId || variant.id);
}

// ===== ЗАКРЫТИЕ =====
function closeShop() {
    if (typeof mp !== 'undefined') {
        mp.trigger('cef:clothingShop:close');
    }
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(type, message) {
    const container = document.getElementById('notifications');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    notif.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

    container.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'notifyOut 0.3s ease forwards';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== API =====
function openClothingShop(shopDataJson, playerDataJson) {
    try {
        shopData = typeof shopDataJson === 'string' ? JSON.parse(shopDataJson) : shopDataJson;
        playerData = typeof playerDataJson === 'string' ? JSON.parse(playerDataJson) : playerDataJson;

        allProducts = shopData.products || [];

        // Добавляем drawable
        allProducts = allProducts.map(p => {
            if (p.clothingData) {
                const cd = typeof p.clothingData === 'string' ? JSON.parse(p.clothingData) : p.clothingData;
                p.drawable = cd.drawable || 0;
            }
            return p;
        });

        // Обновляем UI
        const nameParts = (shopData.name || 'МАГАЗИН').split(' ');
        document.getElementById('shopName').textContent = nameParts[0] || 'МАГАЗИН';
        document.getElementById('shopLocation').textContent = nameParts.slice(1).join(' ') || '';

        document.getElementById('cashBalance').textContent = `$${formatPrice(playerData.cash || 0)}`;
        document.getElementById('bankBalance').textContent = `$${formatPrice(playerData.bank || 0)}`;

        // Сброс
        selectedProduct = null;
        selectedVariant = 0;
        currentCategory = null;
        document.getElementById('variantsPanel').classList.remove('show');
        document.getElementById('btnBuy').disabled = true;
        document.getElementById('productsList').innerHTML = '<div class="products-placeholder"><i class="fas fa-hand-pointer"></i><span>Выберите категорию</span></div>';
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.product-item').forEach(i => i.classList.remove('selected'));

        // Выбираем первую категорию
        selectCategory('tops');

        console.log('[ClothingShop] Магазин открыт:', shopData.name, 'Товаров:', allProducts.length);

    } catch (err) {
        console.error('[ClothingShop] Ошибка:', err);
    }
}

function updateBalance(playerDataJson) {
    try {
        playerData = typeof playerDataJson === 'string' ? JSON.parse(playerDataJson) : playerDataJson;
        document.getElementById('cashBalance').textContent = `$${formatPrice(playerData.cash || 0)}`;
        document.getElementById('bankBalance').textContent = `$${formatPrice(playerData.bank || 0)}`;
    } catch (err) {
        console.error('[ClothingShop] Ошибка баланса:', err);
    }
}

function shopNotify(type, message) {
    showNotification(type, message);
}

// Export
window.openClothingShop = openClothingShop;
window.updateBalance = updateBalance;
window.shopNotify = shopNotify;