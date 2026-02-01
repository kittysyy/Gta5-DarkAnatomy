// ===== КЛИЕНТСКАЯ СИСТЕМА NPC =====
// Только обработка взаимодействия с серверными NPC

let isInteracting = false;

// ===== ОБРАБОТКА ВЗАИМОДЕЙСТВИЯ (КНОПКА E) =====
mp.keys.bind(0x45, false, () => { // E
    if (isInteracting) return;
    
    const player = mp.players.local;
    
    // Ищем ближайший NPC среди всех педов
    mp.peds.forEach(ped => {
        if (!ped || !mp.peds.exists(ped)) return;
        
        const distance = player.position.subtract(ped.position).length();
        
        if (distance < 2.0) {
            isInteracting = true;
            
            // Получаем ID NPC из серверной переменной
            const npcId = ped.getVariable('npcId');
            
            if (npcId !== undefined && npcId !== null) {
                mp.events.callRemote('npc:interact', npcId);
            }
            
            // Разблокируем через 1 секунду
            setTimeout(() => { isInteracting = false; }, 1000);
        }
    });
});

console.log('[NPC System] ✅ Клиентская система NPC загружена');