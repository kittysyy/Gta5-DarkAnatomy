// ===== СИСТЕМА БЕЗОПАСНЫХ ЗОН =====

const { db } = require('../database');

// Конфигурация зон
const safeZones = [
    // Центр города
    {
        id: 'legion_square',
        name: 'Legion Square',
        type: 'circle',
        x: 195.0,
        y: -933.0,
        z: 30.0,
        radius: 100.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    },
    // Больница
    {
        id: 'hospital_pillbox',
        name: 'Pillbox Hospital',
        type: 'circle',
        x: 311.0,
        y: -584.0,
        z: 43.0,
        radius: 80.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    },
    // Полицейский участок
    {
        id: 'police_mission_row',
        name: 'Mission Row PD',
        type: 'circle',
        x: 441.0,
        y: -982.0,
        z: 30.0,
        radius: 70.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    },
    // Мэрия
    {
        id: 'city_hall',
        name: 'City Hall',
        type: 'circle',
        x: -544.0,
        y: -204.0,
        z: 38.0,
        radius: 60.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    },
    // Банк
    {
        id: 'bank_pacific',
        name: 'Pacific Standard Bank',
        type: 'circle',
        x: 241.0,
        y: 220.0,
        z: 106.0,
        radius: 50.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    },
    // Магазины 24/7
    {
        id: 'shop_247_1',
        name: '24/7 Store',
        type: 'circle',
        x: 25.7,
        y: -1347.3,
        z: 29.5,
        radius: 30.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    },
    // Аэропорт (терминал)
    {
        id: 'airport_terminal',
        name: 'Los Santos Airport',
        type: 'circle',
        x: -1037.0,
        y: -2738.0,
        z: 20.0,
        radius: 150.0,
        restrictions: ['weapons', 'vehicle_weapons', 'explosions']
    },
    // Автосалон
    {
        id: 'car_dealership',
        name: 'Premium Deluxe Motorsport',
        type: 'circle',
        x: -56.0,
        y: -1096.0,
        z: 26.0,
        radius: 50.0,
        restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']
    }
];

// Кэш игроков в зонах
const playerZones = new Map();

// ===== ИНИЦИАЛИЗАЦИЯ =====
mp.events.add('playerReady', (player) => {
    playerZones.set(player.id, null);
    player.inSafeZone = false;
    player.currentSafeZone = null;
});

mp.events.add('playerQuit', (player) => {
    playerZones.delete(player.id);
});

// ===== ПРОВЕРКА НАХОЖДЕНИЯ В ЗОНЕ =====
function isPlayerInZone(player, zone) {
    const pos = player.position;
    
    if (zone.type === 'circle') {
        const distance = Math.sqrt(
            Math.pow(pos.x - zone.x, 2) +
            Math.pow(pos.y - zone.y, 2) +
            Math.pow(pos.z - zone.z, 2)
        );
        return distance <= zone.radius;
    }
    
    if (zone.type === 'box') {
        return (
            pos.x >= zone.minX && pos.x <= zone.maxX &&
            pos.y >= zone.minY && pos.y <= zone.maxY &&
            pos.z >= zone.minZ && pos.z <= zone.maxZ
        );
    }
    
    return false;
}

// ===== ПРОВЕРКА ЗОНЫ ДЛЯ ИГРОКА =====
function checkPlayerZone(player) {
    if (!player || !mp.players.exists(player)) return;
    
    let currentZone = null;
    
    for (const zone of safeZones) {
        if (isPlayerInZone(player, zone)) {
            currentZone = zone;
            break;
        }
    }
    
    const previousZone = playerZones.get(player.id);
    
    // Вошёл в зону
    if (currentZone && !previousZone) {
        playerZones.set(player.id, currentZone.id);
        player.inSafeZone = true;
        player.currentSafeZone = currentZone;
        
        player.call('client:enterSafeZone', [JSON.stringify({
            id: currentZone.id,
            name: currentZone.name,
            restrictions: currentZone.restrictions
        })]);
        
        console.log(`[SafeZone] ${player.name} вошёл в зону: ${currentZone.name}`);
    }
    // Вышел из зоны
    else if (!currentZone && previousZone) {
        playerZones.set(player.id, null);
        player.inSafeZone = false;
        player.currentSafeZone = null;
        
        player.call('client:exitSafeZone', []);
        
        console.log(`[SafeZone] ${player.name} вышел из безопасной зоны`);
    }
    // Переход между зонами
    else if (currentZone && previousZone && currentZone.id !== previousZone) {
        playerZones.set(player.id, currentZone.id);
        player.currentSafeZone = currentZone;
        
        player.call('client:enterSafeZone', [JSON.stringify({
            id: currentZone.id,
            name: currentZone.name,
            restrictions: currentZone.restrictions
        })]);
    }
}

// ===== ГЛАВНЫЙ ЦИКЛ ПРОВЕРКИ =====
setInterval(() => {
    mp.players.forEach(player => {
        if (player.characterId) {
            checkPlayerZone(player);
        }
    });
}, 1000);

// ===== БЛОКИРОВКА УРОНА В БЕЗОПАСНОЙ ЗОНЕ =====
mp.events.add('playerDeath', (player, reason, killer) => {
    // Логируем смерть
    console.log(`[SafeZone] Смерть: ${player.name}, причина: ${reason}, убийца: ${killer?.name || 'none'}`);
});

// ===== ПРОВЕРКА ВОЗМОЖНОСТИ АТАКИ =====
mp.events.add('playerWeaponShot', (player, targetPosition, targetEntity, weapon) => {
    if (player.inSafeZone) {
        const zone = player.currentSafeZone;
        if (zone && zone.restrictions.includes('weapons')) {
            // Блокируем выстрел (уведомляем клиента)
            player.call('client:weaponBlocked', ['Стрельба запрещена в этой зоне!']);
        }
    }
});

// ===== АДМИНСКИЕ КОМАНДЫ =====
mp.events.addCommand('createzone', (player, _, name, radius) => {
    if (!player.isAdmin) {
        player.outputChatBox('!{#f44336}У вас нет прав!');
        return;
    }
    
    const pos = player.position;
    const r = parseFloat(radius) || 50;
    
    player.outputChatBox(`!{#4caf50}[SafeZone] Зона создана:`);
    player.outputChatBox(`!{#ffff00}Позиция: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`);
    player.outputChatBox(`!{#ffff00}Радиус: ${r}`);
    player.outputChatBox(`!{#ffff00}Название: ${name || 'New Zone'}`);
    
    // Показываем код для добавления
    player.outputChatBox(`!{#00ffff}Добавьте в safeZones:`);
    player.outputChatBox(`!{#ffffff}{`);
    player.outputChatBox(`!{#ffffff}  id: '${(name || 'new_zone').toLowerCase().replace(/\s/g, '_')}',`);
    player.outputChatBox(`!{#ffffff}  name: '${name || 'New Zone'}',`);
    player.outputChatBox(`!{#ffffff}  type: 'circle',`);
    player.outputChatBox(`!{#ffffff}  x: ${pos.x.toFixed(1)}, y: ${pos.y.toFixed(1)}, z: ${pos.z.toFixed(1)},`);
    player.outputChatBox(`!{#ffffff}  radius: ${r},`);
    player.outputChatBox(`!{#ffffff}  restrictions: ['weapons', 'vehicle_weapons', 'melee', 'explosions']`);
    player.outputChatBox(`!{#ffffff}}`);
});

mp.events.addCommand('checkzone', (player) => {
    if (player.inSafeZone && player.currentSafeZone) {
        player.outputChatBox(`!{#4caf50}[SafeZone] Вы в зоне: ${player.currentSafeZone.name}`);
        player.outputChatBox(`!{#ffff00}Ограничения: ${player.currentSafeZone.restrictions.join(', ')}`);
    } else {
        player.outputChatBox(`!{#ff9800}[SafeZone] Вы не в безопасной зоне`);
    }
});

// ===== ЭКСПОРТ =====
global.safeZoneSystem = {
    isPlayerInSafeZone: (player) => player.inSafeZone || false,
    getPlayerZone: (player) => player.currentSafeZone || null,
    getAllZones: () => safeZones,
    addZone: (zone) => safeZones.push(zone)
};

// ===== УБРАТЬ ОРУЖИЕ В ИНВЕНТАРЬ =====
mp.events.add('safezone:hideWeapon', async (player) => {
    if (!player || !mp.players.exists(player)) return;
    if (!player.characterId) return;
    
    try {
        // Получаем экипированное оружие из слота
        const equippedWeapon = player.equippedWeapon;
        
        if (equippedWeapon && global.inventorySystem) {
            // Снимаем оружие (убираем из рук, но оставляем в инвентаре)
            player.removeAllWeapons();
            player.equippedWeapon = null;
            
            console.log(`[SafeZone] ${player.name} убрал оружие в инвентарь`);
        }
    } catch (err) {
        console.error('[SafeZone] Ошибка убирания оружия:', err);
    }
});

console.log(`[SafeZone] ✅ Система загружена! Зон: ${safeZones.length}`);