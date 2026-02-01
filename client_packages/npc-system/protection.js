// ===== ЗАЩИТА NPC ОТ УРОНА - КЛИЕНТ =====

// Массив защищённых NPC (локальные ID)
const protectedPeds = new Set();
let lastNPCWarning = 0;

// ===== РЕГИСТРАЦИЯ ЗАЩИЩЁННОГО NPC =====
mp.events.add('npc:registerProtected', (pedHandle) => {
    protectedPeds.add(pedHandle);
    
    // Делаем NPC неуязвимым
    try {
        mp.game.invoke('0x166E7CF68597D8B5', pedHandle, true); // SET_ENTITY_INVINCIBLE
        mp.game.invoke('0x7A6535691B477C48', pedHandle, false); // SET_PED_CAN_RAGDOLL
        mp.game.invoke('0x9F8AA94D6D97DBF4', pedHandle, false); // SET_PED_CAN_RAGDOLL_FROM_PLAYER_IMPACT
        mp.game.invoke('0x0F62619393661D6E', pedHandle, false, false); // SET_PED_CAN_BE_TARGETTED
        mp.game.invoke('0xFDDB234CF74073D9', pedHandle, false); // SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE
        
        console.log(`[NPC Protection] Зарегистрирован NPC: ${pedHandle}`);
    } catch (err) {
        console.error('[NPC Protection] Ошибка регистрации:', err);
    }
});

// ===== СНЯТИЕ ЗАЩИТЫ =====
mp.events.add('npc:unregisterProtected', (pedHandle) => {
    protectedPeds.delete(pedHandle);
});

// ===== БЛОКИРОВКА ПРИЦЕЛИВАНИЯ НА NPC =====
mp.events.add('render', () => {
    const player = mp.players.local;
    const now = Date.now();
    
    // Получаем сущность под прицелом
    let targetEntity = null;
    
    try {
        // Проверяем на кого игрок целится
        if (mp.game.player.isFreeAiming()) {
            const aimingAt = mp.game.player.getEntityPlayerIsFreeAimingAt(mp.players.local.handle);
            if (aimingAt && aimingAt !== 0) {
                targetEntity = aimingAt;
            }
        }
    } catch (err) {}
    
    // Если целимся на защищённого NPC
    if (targetEntity && protectedPeds.has(targetEntity)) {
        // Отключаем атаку
        mp.game.controls.disableControlAction(0, 24, true);  // Attack
        mp.game.controls.disableControlAction(0, 140, true); // Melee light
        mp.game.controls.disableControlAction(0, 141, true); // Melee heavy
        
        // Показываем предупреждение
        if (mp.game.controls.isDisabledControlPressed(0, 24) ||
            mp.game.controls.isDisabledControlPressed(0, 140) ||
            mp.game.controls.isDisabledControlPressed(0, 141)) {
            if (now - lastNPCWarning > 2000) {
                mp.game.graphics.notify('~r~Нельзя атаковать этого NPC!');
                lastNPCWarning = now;
            }
        }
    }
    
    // Защищаем всех NPC системы
    protectedPeds.forEach(pedHandle => {
        try {
            // Обновляем неуязвимость каждый кадр
            mp.game.invoke('0x166E7CF68597D8B5', pedHandle, true); // SET_ENTITY_INVINCIBLE
        } catch (err) {}
    });
});

// ===== АВТОМАТИЧЕСКАЯ ЗАЩИТА СОЗДАННЫХ NPC =====
mp.events.add('entityStreamIn', (entity) => {
    // Проверяем является ли это нашим NPC
    if (entity.type === 'ped' && entity.getVariable && entity.getVariable('isServerNPC')) {
        const handle = entity.handle;
        protectedPeds.add(handle);
        
        mp.game.invoke('0x166E7CF68597D8B5', handle, true);
        mp.game.invoke('0x7A6535691B477C48', handle, false);
        mp.game.invoke('0x9F8AA94D6D97DBF4', handle, false);
        mp.game.invoke('0x0F62619393661D6E', handle, false, false);
        
        console.log(`[NPC Protection] Автозащита NPC: ${handle}`);
    }
});

// ===== ГЛОБАЛЬНАЯ ЗАЩИТА ВСЕХ МИРНЫХ NPC =====
setInterval(() => {
    const player = mp.players.local;
    const pos = player.position;
    
    // Получаем всех NPC в радиусе
    mp.peds.forEachInStreamRange(ped => {
        if (ped.handle === player.handle) return;
        if (ped.type !== 'ped') return;
        
        try {
            const pedHandle = ped.handle;
            
            // Проверяем тип NPC (не враг, не полиция в погоне и т.д.)
            const pedType = mp.game.ped.getPedType(pedHandle);
            
            // Типы: 0-Mission, 1-Player, 4-CivMale, 5-CivFemale, 6-Cop, etc.
            // Защищаем мирных NPC (4, 5, 26, 27, 28)
            const peacefulTypes = [4, 5, 26, 27, 28];
            
            if (peacefulTypes.includes(pedType)) {
                // Делаем неуязвимым
                mp.game.invoke('0x166E7CF68597D8B5', pedHandle, true);
            }
        } catch (err) {}
    });
}, 2000);

console.log('[NPC Protection Client] ✅ Система защиты NPC загружена');