// ===== СИСТЕМА МАГАЗИНОВ =====

const { db } = require('../database');
const { getBestTorso } = require('./clothingData');

// Хранилище магазинов
const shops = new Map();
const shopBlips = new Map();

// ===== ИНИЦИАЛИЗАЦИЯ =====
async function initShops() {
    try {
        const [shopList] = await db.query('SELECT * FROM shops WHERE is_active = TRUE');
        
        shopList.forEach(shop => {
            shops.set(shop.id, shop);
            
            // Создаём блип на карте
            const blip = mp.blips.new(shop.blip_sprite || 73, new mp.Vector3(shop.position_x, shop.position_y, shop.position_z), {
                name: shop.name,
                color: shop.blip_color || 4,
                shortRange: true,
                scale: 0.85
            });
            shopBlips.set(shop.id, blip);
            
            // Создаём колшейп для входа
            const colshape = mp.colshapes.newSphere(shop.position_x, shop.position_y, shop.position_z, 2.5, 0);
            colshape.shopId = shop.id;
            colshape.shopType = shop.type;
        });
        
        console.log(`[Shops] ✅ Загружено магазинов: ${shopList.length}`);
    } catch (err) {
        console.error('[Shops] Ошибка инициализации:', err);
    }
}

// ===== ВХОД В ЗОНУ МАГАЗИНА =====
mp.events.add('playerEnterColshape', (player, colshape) => {
    if (!player || !mp.players.exists(player)) return;
    if (colshape.shopId === undefined) return;
    
    const shop = shops.get(colshape.shopId);
    if (!shop) return;
    
    player.call('client:showShopHint', [shop.name, shop.type]);
    player.currentShopId = colshape.shopId;
    player.currentShopType = colshape.shopType;
});

mp.events.add('playerExitColshape', (player, colshape) => {
    if (!player || !mp.players.exists(player)) return;
    if (colshape.shopId === undefined) return;
    
    player.call('client:hideShopHint');
    player.currentShopId = null;
    player.currentShopType = null;
});

// ===== ОТКРЫТИЕ МАГАЗИНА ОДЕЖДЫ =====
mp.events.add('clothingShop:open', async (player) => {
    if (!player || !mp.players.exists(player) || !player.characterId) return;
    if (!player.currentShopId) return;
    
    const shop = shops.get(player.currentShopId);
    if (!shop || shop.type !== 'clothing') return;
    
    try {
        // Получаем товары магазина
        const [products] = await db.query(`
            SELECT 
                sp.id as productId,
                sp.item_id as itemId,
                sp.price,
                sp.discount,
                i.name as itemName,
                i.display_name as displayName,
                i.description,
                i.type as itemType,
                i.icon,
                i.weight,
                i.clothing_data as clothingData,
                i.model_data as modelData
            FROM shop_products sp
            JOIN items i ON sp.item_id = i.id
            WHERE sp.shop_type = 'clothing' AND sp.is_available = TRUE
            ORDER BY i.name
        `);
        
        // Получаем баланс игрока
        const [charResult] = await db.query(
            'SELECT money, bank FROM characters WHERE id = ?',
            [player.characterId]
        );
        
        const playerData = {
            cash: charResult[0]?.money || 0,
            bank: charResult[0]?.bank || 0
        };
        
        // Форматируем товары
        const formattedProducts = products.map(p => {
            let clothingData = null;
            try {
                clothingData = p.clothingData ? 
                    (typeof p.clothingData === 'string' ? JSON.parse(p.clothingData) : p.clothingData) : null;
            } catch (e) {}
            
            return {
                productId: p.productId,
                itemId: p.itemId,
                id: p.productId,
                name: p.displayName || p.itemName,
                itemName: p.itemName,
                displayName: p.displayName,
                description: p.description,
                type: p.itemType,
                price: p.price,
                discount: p.discount || 0,
                finalPrice: Math.floor(p.price * (1 - (p.discount || 0) / 100)),
                icon: p.icon,
                weight: p.weight,
                clothingData: clothingData,
                drawable: clothingData?.drawable || 0
            };
        });
        
        const shopData = {
            id: shop.id,
            name: shop.name,
            type: shop.type,
            products: formattedProducts
        };
        
        player.call('client:openClothingShop', [JSON.stringify(shopData), JSON.stringify(playerData)]);
        
    } catch (err) {
        console.error('[Shops] Ошибка открытия магазина одежды:', err);
    }
});

// ===== ПРИМЕРКА ОДЕЖДЫ =====
mp.events.add('clothingShop:tryOn', async (player, itemId) => {
    if (!player || !mp.players.exists(player)) return;
    
    try {
        const [items] = await db.query(
            'SELECT clothing_data, model_data FROM items WHERE id = ?',
            [itemId]
        );
        
        if (items.length === 0) return;
        
        const item = items[0];
        let clothingData = null;
        
        if (item.model_data) {
            clothingData = typeof item.model_data === 'string' ? JSON.parse(item.model_data) : item.model_data;
        } else if (item.clothing_data) {
            clothingData = typeof item.clothing_data === 'string' ? JSON.parse(item.clothing_data) : item.clothing_data;
        }
        
        if (!clothingData) return;
        
        const isProp = clothingData.propId !== undefined;
        const drawable = clothingData.drawable || 0;
        const texture = clothingData.texture || 0;
        
        if (isProp) {
            player.call('client:clothingShop:applyProp', [clothingData.propId, drawable, texture]);
        } else {
            const componentId = clothingData.componentId;
            
            if (componentId === 11) {
                const { getBestTorso } = require('./clothingData');
                const torsoData = getBestTorso(drawable, texture);
                
                if (torsoData) {
                    player.call('client:clothingShop:applyTop', [drawable, texture, torsoData.torsoDrawable, torsoData.torsoTexture]);
                } else {
                    player.call('client:clothingShop:applyTopNoTorso', [drawable, texture]);
                }
            } else {
                player.call('client:clothingShop:applyComponent', [componentId, drawable, texture]);
            }
        }
    } catch (err) {
        console.error('[Shops] Ошибка примерки:', err);
    }
});

// ===== ПОКУПКА =====
mp.events.add('clothingShop:buy', async (player, productId, quantity, paymentType) => {
    if (!player || !mp.players.exists(player) || !player.characterId) return;
    
    try {
        productId = parseInt(productId);
        quantity = parseInt(quantity) || 1;
        
        if (quantity < 1 || quantity > 100) {
            player.call('client:clothingShop:notify', ['error', 'Неверное количество']);
            return;
        }
        
        // Получаем товар
        const [products] = await db.query(`
            SELECT sp.*, i.name, i.display_name, i.max_stack
            FROM shop_products sp
            JOIN items i ON sp.item_id = i.id
            WHERE sp.id = ? AND sp.is_available = TRUE
        `, [productId]);
        
        if (products.length === 0) {
            player.call('client:clothingShop:notify', ['error', 'Товар не найден']);
            return;
        }
        
        const product = products[0];
        const finalPrice = Math.floor(product.price * (1 - (product.discount || 0) / 100)) * quantity;
        
        // Получаем баланс игрока
        const [charResult] = await db.query(
            'SELECT money, bank FROM characters WHERE id = ?',
            [player.characterId]
        );
        
        const playerCash = charResult[0]?.money || 0;
        const playerBank = charResult[0]?.bank || 0;
        
        // Проверяем оплату
        let canBuy = false;
        const useBank = paymentType === 'bank';
        
        if (useBank) {
            canBuy = playerBank >= finalPrice;
        } else {
            canBuy = playerCash >= finalPrice;
        }
        
        if (!canBuy) {
            player.call('client:clothingShop:notify', ['error', 'Недостаточно средств']);
            return;
        }
        
        // Добавляем предмет в инвентарь
        const success = await global.addItem(player.characterId, product.name, quantity);
        
        if (!success) {
            player.call('client:clothingShop:notify', ['error', 'Инвентарь полон!']);
            return;
        }
        
        // Списываем деньги
        if (useBank) {
            await db.query('UPDATE characters SET bank = bank - ? WHERE id = ?', [finalPrice, player.characterId]);
        } else {
            await db.query('UPDATE characters SET money = money - ? WHERE id = ?', [finalPrice, player.characterId]);
        }
        
        // Обновляем данные игрока
        const [newBalance] = await db.query(
            'SELECT money, bank FROM characters WHERE id = ?',
            [player.characterId]
        );
        
        player.call('client:clothingShop:notify', ['success', `Куплено: ${product.display_name || product.name}`]);
        player.call('client:clothingShop:updateBalance', [JSON.stringify({
            cash: newBalance[0]?.money || 0,
            bank: newBalance[0]?.bank || 0
        })]);
        
    } catch (err) {
        console.error('[Shops] Ошибка покупки:', err);
        player.call('client:clothingShop:notify', ['error', 'Ошибка покупки']);
    }
});

// ===== ОТКРЫТИЕ ОБЫЧНОГО МАГАЗИНА =====
mp.events.add('shop:open', async (player) => {
    if (!player || !mp.players.exists(player) || !player.characterId) return;
    if (!player.currentShopId) return;
    
    const shop = shops.get(player.currentShopId);
    if (!shop) return;
    
    // TODO: Реализовать другие типы магазинов (general, weapon, и т.д.)
    player.outputChatBox(`!{#ff9800}Магазин "${shop.name}" пока в разработке`);
});

// Загружаем магазины при старте
setTimeout(initShops, 3000);

console.log('[Shops] ✅ Система магазинов загружена');