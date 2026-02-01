// ===== СИСТЕМА БЕЗОПАСНЫХ ЗОН - КЛИЕНТ =====

let inSafeZone = false;
let currentZone = null;
let zoneRestrictions = [];
let lastWeaponWarning = 0;

// ===== ВХОД В БЕЗОПАСНУЮ ЗОНУ =====
mp.events.add('client:enterSafeZone', (zoneDataJson) => {
    try {
        const zone = JSON.parse(zoneDataJson);
        inSafeZone = true;
        currentZone = zone;
        zoneRestrictions = zone.restrictions || [];
        
        // Уведомление
        mp.game.graphics.notify(`~g~Вы вошли в безопасную зону~w~\n${zone.name}`);
        
        // Показываем эффект
        mp.game.graphics.startScreenEffect('MenuMGIn', 500, false);
        
        console.log(`[SafeZone] Вошёл в зону: ${zone.name}`);
        
    } catch (err) {
        console.error('[SafeZone] Ошибка:', err);
    }
});

// ===== ВЫХОД ИЗ БЕЗОПАСНОЙ ЗОНЫ =====
mp.events.add('client:exitSafeZone', () => {
    inSafeZone = false;
    currentZone = null;
    zoneRestrictions = [];
    
    mp.game.graphics.notify('~o~Вы покинули безопасную зону');
    
    console.log('[SafeZone] Вышел из зоны');
});

// ===== БЛОКИРОВКА ОРУЖИЯ =====
mp.events.add('client:weaponBlocked', (message) => {
    mp.game.graphics.notify(`~r~${message}`);
});

// ===== ГЛАВНЫЙ ЦИКЛ - БЛОКИРОВКА ДЕЙСТВИЙ =====
mp.events.add('render', () => {
    if (!inSafeZone) return;
    
    const player = mp.players.local;
    const now = Date.now();
    
    // Блокируем оружие
    if (zoneRestrictions.includes('weapons')) {
        // Отключаем стрельбу
        mp.game.controls.disableControlAction(0, 24, true);  // Attack
        mp.game.controls.disableControlAction(0, 25, true);  // Aim
        mp.game.controls.disableControlAction(0, 47, true);  // Weapon (G)
        mp.game.controls.disableControlAction(0, 58, true);  // Weapon (throw)
        mp.game.controls.disableControlAction(0, 140, true); // Melee attack light
        mp.game.controls.disableControlAction(0, 141, true); // Melee attack heavy
        mp.game.controls.disableControlAction(0, 142, true); // Melee attack alternate
        mp.game.controls.disableControlAction(0, 263, true); // Melee attack 1
        mp.game.controls.disableControlAction(0, 264, true); // Melee attack 2
        
        // Если игрок пытается стрелять - показываем предупреждение
        if (mp.game.controls.isDisabledControlPressed(0, 24) || 
            mp.game.controls.isDisabledControlPressed(0, 25)) {
            if (now - lastWeaponWarning > 3000) {
                mp.game.graphics.notify('~r~Оружие запрещено в этой зоне!');
                lastWeaponWarning = now;
            }
        }
    }
    
    // Блокируем оружие транспорта
    if (zoneRestrictions.includes('vehicle_weapons')) {
        if (player.vehicle) {
            mp.game.controls.disableControlAction(0, 69, true);  // Vehicle attack
            mp.game.controls.disableControlAction(0, 70, true);  // Vehicle attack 2
            mp.game.controls.disableControlAction(0, 114, true); // Vehicle fly attack
            mp.game.controls.disableControlAction(0, 331, true); // Vehicle horn attack
        }
    }
    
    // Блокируем ближний бой
    if (zoneRestrictions.includes('melee')) {
        mp.game.controls.disableControlAction(0, 140, true);
        mp.game.controls.disableControlAction(0, 141, true);
        mp.game.controls.disableControlAction(0, 142, true);
        mp.game.controls.disableControlAction(0, 24, true);
    }
});

// ===== ОТРИСОВКА ИНДИКАТОРА ЗОНЫ =====
mp.events.add('render', () => {
    if (!inSafeZone || !currentZone) return;
    
    // Показываем индикатор в углу экрана
    mp.game.graphics.drawText('🛡️ БЕЗОПАСНАЯ ЗОНА', [0.5, 0.02], {
        font: 4,
        color: [100, 255, 100, 200],
        scale: [0.35, 0.35],
        outline: true,
        centre: true
    });
});

console.log('[SafeZone Client] ✅ Система безопасных зон загружена');