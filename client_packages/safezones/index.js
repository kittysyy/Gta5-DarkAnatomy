// ===== СИСТЕМА БЕЗОПАСНЫХ ЗОН - КЛИЕНТ =====

let inSafeZone = false;
let currentZone = null;
let zoneRestrictions = [];
let lastWeaponWarning = 0;
let weaponsHidden = false;

const WEAPON_UNARMED = 0xA2719263;

// ===== ВХОД В БЕЗОПАСНУЮ ЗОНУ =====
mp.events.add('client:enterSafeZone', (zoneDataJson) => {
    try {
        const zone = JSON.parse(zoneDataJson);
        inSafeZone = true;
        currentZone = zone;
        zoneRestrictions = zone.restrictions || [];
        
        mp.game.graphics.notify(`~g~Вы вошли в безопасную зону~w~\n${zone.name}`);
        console.log(`[SafeZone] Вошёл в зону: ${zone.name}`);
        
        // Убираем оружие в инвентарь при входе
        if (zoneRestrictions.includes('weapons') && !weaponsHidden) {
            setTimeout(() => {
                mp.events.callRemote('safezone:hideWeapon');
                weaponsHidden = true;
            }, 500);
        }
        
    } catch (err) {
        console.error('[SafeZone] Ошибка:', err);
    }
});

// ===== ВЫХОД ИЗ БЕЗОПАСНОЙ ЗОНЫ =====
mp.events.add('client:exitSafeZone', () => {
    inSafeZone = false;
    currentZone = null;
    zoneRestrictions = [];
    weaponsHidden = false;
    
    mp.game.graphics.notify('~o~Вы покинули безопасную зону');
    console.log('[SafeZone] Вышел из зоны');
});

// ===== ПОЛУЧИТЬ ТЕКУЩЕЕ ОРУЖИЕ =====
function getCurrentWeapon() {
    const player = mp.players.local;
    // Используем native напрямую
    return mp.game.invoke('0x0A6DB4965674D243', player.handle);
}

// ===== УСТАНОВИТЬ ОРУЖИЕ =====
function setCurrentWeapon(weaponHash) {
    const player = mp.players.local;
    mp.game.invoke('0xADF692B254977C0C', player.handle, weaponHash, true);
}

// ===== ГЛАВНЫЙ ЦИКЛ =====
mp.events.add('render', () => {
    if (!inSafeZone) return;
    if (mp.gui.cursor.visible) return;
    
    const now = Date.now();
    
    if (zoneRestrictions.includes('weapons')) {
        
        try {
            // Получаем текущее оружие
            const currentWeapon = getCurrentWeapon();
            
            // Если в руках оружие - убираем
            if (currentWeapon !== WEAPON_UNARMED) {
                setCurrentWeapon(WEAPON_UNARMED);
                
                if (now - lastWeaponWarning > 3000) {
                    mp.game.graphics.notify('~r~Оружие запрещено в безопасной зоне!');
                    lastWeaponWarning = now;
                }
            }
        } catch (err) {}
        
        // Блокируем контролы оружия
        mp.game.controls.disableControlAction(0, 24, true);  // Attack
        mp.game.controls.disableControlAction(0, 25, true);  // Aim
        mp.game.controls.disableControlAction(0, 45, true);  // Reload
        mp.game.controls.disableControlAction(0, 47, true);  // Detonate
        mp.game.controls.disableControlAction(0, 58, true);  // Throw grenade
        mp.game.controls.disableControlAction(0, 140, true); // Melee light
        mp.game.controls.disableControlAction(0, 141, true); // Melee heavy
        mp.game.controls.disableControlAction(0, 142, true); // Melee alt
        
        // Блокируем колесо оружия
        mp.game.controls.disableControlAction(0, 14, true);
        mp.game.controls.disableControlAction(0, 15, true);
        mp.game.controls.disableControlAction(0, 16, true);
        mp.game.controls.disableControlAction(0, 17, true);
        mp.game.controls.disableControlAction(0, 37, true);
        mp.game.controls.disableControlAction(0, 157, true);
        mp.game.controls.disableControlAction(0, 158, true);
        mp.game.controls.disableControlAction(0, 160, true);
        mp.game.controls.disableControlAction(0, 161, true);
        
        // Блокируем оружие в транспорте
        mp.game.controls.disableControlAction(0, 68, true);
        mp.game.controls.disableControlAction(0, 69, true);
        mp.game.controls.disableControlAction(0, 70, true);
        mp.game.controls.disableControlAction(0, 114, true);
    }
});

// ===== ИНДИКАТОР ЗОНЫ =====
mp.events.add('render', () => {
    if (!inSafeZone || !currentZone) return;
    
    mp.game.graphics.drawText('🛡️ БЕЗОПАСНАЯ ЗОНА', [0.5, 0.02], {
        font: 4,
        color: [100, 255, 100, 200],
        scale: [0.35, 0.35],
        outline: true,
        centre: true
    });
});

console.log('[SafeZone Client] ✅ Загружено');