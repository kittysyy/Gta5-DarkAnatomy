// ===== СИСТЕМА МАГАЗИНОВ =====

const { db } = require('../database');
const { getBestTorso } = require('./clothingData');

// Хранилище магазинов
const shops = new Map();
const shopMarkers = new Map();
const shopBlips = new Map();

// ===== ИНИЦИАЛИЗАЦИЯ =====
async function initShops() {
    try {
        const [shopList] = await db.query('SELECT * FROM shops WHERE is_active = TRUE');
        
        shopList.forEach(shop => {
            shops.set(shop.id, shop);
            
            // Создаём блип на карте
            const blip = mp.blips.new(shop.blip_sprite, new mp.Vector3(shop.position_x, shop.position_y, shop.position_z), {
                name: shop.name,
                color: shop.blip_color,
                shortRange: true,
                scale: 0.8
            });
            shopBlips.set(shop.id, blip);
            
            // Создаём маркер
            const marker = mp.markers.new(1, new mp.Vector3(shop.position_x, shop.position_y, shop.position_z - 1), 1.5, {
                color: getMarkerColor(shop.type),
                visible: true,
                dimension: 0
            });
            shopMarkers.set(shop.id, marker);
            
            // Создаём колшейп для входа
            const colshape = mp.colshapes.newSphere(shop.position_x, shop.position_y, shop.position_z, 2.0, 0);
            colshape.shopId = shop.id;
            colshape.shopType = shop.type;
        });
        
        console.log(`[Shops] ✅ Загружено магазинов: ${shopList.length}`);
    } catch (err) {
        console.error('[Shops] Ошибка инициализации:', err);
    }
}

function getMarkerColor(type) {
    switch (type) {
        case 'general': return [50, 200, 50, 150];      // Зелёный
        case 'clothing': return [200, 50, 200, 150];    // Фиолетовый
        case 'weapon': return [200, 50, 50, 150];       // Красный
        case 'gasstation': return [200, 150, 50, 150];  // Оранжевый
        default: return [255, 255, 255, 150];
    }
}

// ===== ВХОД В МАГАЗИН =====
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

// ===== ОТКРЫТИЕ МАГАЗИНА =====
mp.events.add('shop:open', async (player) => {
    if (!player || !mp.players.exists(player)) return;
    if (!player.currentShopId) return;
    
    try {
        const shop = shops.get(player.currentShopId);
        if (!shop) return;
        
        // Получаем товары магазина
        const [products] = await db.query(`
            SELECT sp.*, i.name, i.display_name, i.description, i.type as item_type, i.icon, i.weight
            FROM shop_products sp
            JOIN items i ON sp.item_id = i.id
            WHERE sp.shop_type = ? AND sp.is_available = TRUE
            ORDER BY i.type, i.display_name
        `, [shop.type]);
        
        // Получаем баланс игрока
        const [charResult] = await db.query(
            'SELECT money, bank FROM characters WHERE id = ?',
            [player.characterId]
        );
        
        const playerData = {
            cash: charResult[0]?.money || 0,
            bank: charResult[0]?.bank || 0
        };
        
        const shopData = {
            id: shop.id,
            name: shop.name,
            type: shop.type,
            products: products.map(p => ({
                id: p.id,
                itemId: p.item_id,
                name: p.display_name || p.name,
                description: p.description,
                type: p.item_type,
                price: p.price,
                discount: p.discount,
                finalPrice: Math.floor(p.price * (1 - p.discount / 100)),
                icon: p.icon,
                weight: p.weight
            }))
        };
        
        player.call('client:openShop', [JSON.stringify(shopData), JSON.stringify(playerData)]);
        
    } catch (err) {
        console.error('[Shops] Ошибка открытия магазина:', err);
    }
});

// ===== ПОКУПКА ТОВАРА =====
mp.events.add('shop:buy', async (player, productId, quantity, paymentType) => {
    if (!player || !mp.players.exists(player) || !player.characterId) return;
    
    try {
        productId = parseInt(productId);
        quantity = parseInt(quantity) || 1;
        
        if (quantity < 1 || quantity > 100) {
            player.call('client:shopNotify', ['error', 'Неверное количество']);
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
            player.call('client:shopNotify', ['error', 'Товар не найден']);
            return;
        }
        
        const product = products[0];
        const finalPrice = Math.floor(product.price * (1 - product.discount / 100)) * quantity;
        
        // Получаем баланс игрока
        const [charResult] = await db.query(
            'SELECT money, bank FROM characters WHERE id = ?',
            [player.characterId]
        );
        
        const playerCash = charResult[0]?.money || 0;
        const playerBank = charResult[0]?.bank || 0;
        
        // Проверяем оплату
        let canBuy = false;
        let useBank = paymentType === 'bank';
        
        if (useBank) {
            canBuy = playerBank >= finalPrice;
        } else {
            canBuy = playerCash >= finalPrice;
        }
        
        if (!canBuy) {
            player.call('client:shopNotify', ['error', 'Недостаточно средств']);
            return;
        }
        
        // Добавляем предмет в инвентарь
        const success = await global.addItem(player.characterId, product.name, quantity);
        
        if (!success) {
            player.call('client:shopNotify', ['error', 'Инвентарь полон']);
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
        
        player.call('client:shopNotify', ['success', `Куплено: ${product.display_name || product.name} x${quantity}`]);
        player.call('client:updateShopBalance', [JSON.stringify({
            cash: newBalance[0]?.money || 0,
            bank: newBalance[0]?.bank || 0
        })]);
        
        // Логируем покупку
        console.log(`[Shops] ${player.name} купил ${product.name} x${quantity} за $${finalPrice}`);
        
    } catch (err) {
        console.error('[Shops] Ошибка покупки:', err);
        player.call('client:shopNotify', ['error', 'Ошибка покупки']);
    }
});

// ===== ЗАПРАВКА ТРАНСПОРТА =====
mp.events.add('shop:refuel', async (player, amount) => {
    if (!player || !mp.players.exists(player) || !player.characterId) return;
    if (!player.vehicle) {
        player.call('client:shopNotify', ['error', 'Вы не в транспорте']);
        return;
    }
    
    try {
        amount = parseInt(amount) || 10;
        const pricePerLiter = 3; // $3 за литр
        const totalPrice = amount * pricePerLiter;
        
        // Проверяем баланс
        const [charResult] = await db.query(
            'SELECT money FROM characters WHERE id = ?',
            [player.characterId]
        );
        
        if ((charResult[0]?.money || 0) < totalPrice) {
            player.call('client:shopNotify', ['error', 'Недостаточно средств']);
            return;
        }
        
        // Списываем деньги
        await db.query('UPDATE characters SET money = money - ? WHERE id = ?', [totalPrice, player.characterId]);
        
        // Заправляем (если есть система топлива)
        if (player.vehicle.fuel !== undefined) {
            player.vehicle.fuel = Math.min(100, (player.vehicle.fuel || 0) + amount);
        }
        
        player.call('client:shopNotify', ['success', `Заправлено ${amount}л за $${totalPrice}`]);
        
        // Обновляем баланс
        const [newBalance] = await db.query('SELECT money, bank FROM characters WHERE id = ?', [player.characterId]);
        player.call('client:updateShopBalance', [JSON.stringify({
            cash: newBalance[0]?.money || 0,
            bank: newBalance[0]?.bank || 0
        })]);
        
    } catch (err) {
        console.error('[Shops] Ошибка заправки:', err);
    }
});

// ===== ПРИМЕРКА ОДЕЖДЫ =====
mp.events.add('shop:tryClothing', async (player, itemId) => {
    try {
        console.log('[Shop] Примерка предмета:', itemId);
        
        const [items] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
        if (items.length === 0) return;
        
        const item = items[0];
        if (!item.clothing_data) return;
        
        let clothingData;
        try {
            clothingData = typeof item.clothing_data === 'string' 
                ? JSON.parse(item.clothing_data) 
                : item.clothing_data;
        } catch (e) {
            console.error('[Shop] Ошибка парсинга:', e);
            return;
        }
        
        // Если есть components - применяем все
        if (clothingData.components && Array.isArray(clothingData.components)) {
            for (const comp of clothingData.components) {
                player.setClothes(comp.id, comp.drawable, comp.texture || 0, 0);
            }
        }
        // Если только top - автоматически подбираем torso
        else if (clothingData.componentId === 11) {
            const topDrawable = clothingData.drawable;
            const bestTorso = getBestTorso(topDrawable);
            
            player.setClothes(3, bestTorso, 0, 0);      // Torso
            player.setClothes(8, 15, 0, 0);              // Undershirt (none)
            player.setClothes(11, topDrawable, clothingData.texture || 0, 0); // Top
            
            console.log(`[Shop] Top=${topDrawable}, Auto Torso=${bestTorso}`);
        }
        // Одиночный компонент
        else if (clothingData.componentId !== undefined) {
            player.setClothes(clothingData.componentId, clothingData.drawable, clothingData.texture || 0, 0);
        }
        // Prop
        else if (clothingData.propId !== undefined) {
            player.setProp(clothingData.propId, clothingData.drawable, clothingData.texture || 0);
        }
        
    } catch (err) {
        console.error('[Shop] Ошибка примерки:', err);
    }
});

// ===== СБРОС ПРИМЕРКИ =====
mp.events.add('shop:resetClothing', async (player) => {
    // Восстановление происходит на клиенте
    console.log('[Shop] Запрос сброса одежды');
});

// Загружаем магазины при старте
setTimeout(initShops, 3000);

console.log('[Shops] ✅ Система магазинов загружена');