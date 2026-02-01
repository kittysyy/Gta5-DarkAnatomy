// ===== КЛИЕНТСКАЯ СИСТЕМА NPC =====

let isInteracting = false;

// ===== ЗАМОРОЗКА NPC =====
setInterval(() => {
    mp.peds.forEach(ped => {
        if (!ped || !mp.peds.exists(ped)) return;
        
        const isServerNPC = ped.getVariable('isServerNPC');
        if (!isServerNPC) return;
        
        try {
            // Заморозка позиции
            mp.game.entity.freezePosition(ped.handle, true);
            
            // Неуязвимость
            mp.game.entity.setInvincible(ped.handle, true);
            
            // Отключаем ragdoll
            mp.game.ped.setCanRagdoll(ped.handle, false);
            
            // Отключаем реакции на события
            mp.game.ped.setBlockingOfNonTemporaryEvents(ped.handle, true);
            
            // Отключаем побег (0 = не убегать)
            mp.game.ped.setFleeAttributes(ped.handle, 0, false);
            
            // Отключаем боевое поведение
            mp.game.ped.setCombatAttributes(ped.handle, 46, true); // BF_CanFightArmedPedsWhenNotArmed = ignore
            
        } catch (err) {}
    });
}, 500);

// ===== ОБРАБОТКА ВЗАИМОДЕЙСТВИЯ (КНОПКА E) =====
mp.keys.bind(0x45, false, () => {
    if (isInteracting) return;
    if (mp.gui.cursor.visible) return;
    
    const player = mp.players.local;
    
    mp.peds.forEach(ped => {
        if (!ped || !mp.peds.exists(ped)) return;
        
        const distance = player.position.subtract(ped.position).length();
        
        if (distance < 2.0) {
            isInteracting = true;
            
            const npcId = ped.getVariable('npcId');
            
            if (npcId !== undefined && npcId !== null) {
                mp.events.callRemote('npc:interact', npcId);
            }
            
            setTimeout(() => { isInteracting = false; }, 1000);
        }
    });
});

console.log('[NPC System] ✅ Клиентская система NPC загружена');