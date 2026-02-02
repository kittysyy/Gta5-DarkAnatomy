// ===== СЕРВЕРНАЯ СИСТЕМА NPC =====
const npcConfigs = require('./npcData');

let spawnedNPCs = [];

function spawnAllNPCs() {
    console.log('[NPC System] Создаём NPC...');
    
    npcConfigs.forEach(npc => {
        try {
            const ped = mp.peds.new(
                mp.joaat(npc.model),
                new mp.Vector3(npc.position.x, npc.position.y, npc.position.z),
                npc.position.h,
                0
            );
            
            // Синхронизируемые переменные
            ped.setVariable('npcId', npc.id);
            ped.setVariable('npcType', npc.type);
            ped.setVariable('npcName', npc.name);
            ped.setVariable('isServerNPC', true); // ДОБАВЛЕНО для заморозки
            
            // Локальные данные
            ped.npcData = npc.data;
            
            spawnedNPCs.push(ped);
            
            console.log(`[NPC System] ✅ Создан NPC: ${npc.name} (ID: ${npc.id})`);
        } catch (error) {
            console.error(`[NPC System] ❌ Ошибка создания NPC ${npc.id}:`, error);
        }
    });
    
    console.log(`[NPC System] ✅ Всего создано ${spawnedNPCs.length} NPC`);
}

// Спавним при старте сервера
spawnAllNPCs();

// ===== ОТПРАВКА СПИСКА NPC НОВЫМ ИГРОКАМ =====
mp.events.add('playerReady', (player) => {
    setTimeout(() => {
        const npcIds = spawnedNPCs.map(ped => ped.id);
        player.call('client:registerServerNPCs', [JSON.stringify(npcIds)]);
    }, 3000);
});

// ===== ОБРАБОТКА ВЗАИМОДЕЙСТВИЯ =====
mp.events.add('npc:interact', (player, npcId) => {
    if (!player || !mp.players.exists(player)) return;
    
    const ped = spawnedNPCs.find(p => p.getVariable('npcId') === npcId);
    
    // Проверяем NPC курьера (создаётся в jobs)
    if (npcId === 'courier_npc') {
        console.log(`[NPC System] ${player.name} → Курьерская служба`);
        mp.events.call('jobs:openCourierNPC', player);
        return;
    }
    
    if (!ped) return;
    
    const distance = player.position.subtract(ped.position).length();
    if (distance > 3.0) return;
    
    const npcType = ped.getVariable('npcType');
    const npcName = ped.getVariable('npcName');
    
    console.log(`[NPC System] ${player.name} → ${npcName}`);
    
    if (npcType === 'shop') {
        player.outputChatBox(`!{#00ff00}[${npcName}] Добро пожаловать!`);
    } else if (npcType === 'quest') {
        if (global.questSystem && ped.npcData?.questId) {
            global.questSystem.openQuestDialog(player, ped.npcData.questId);
        }
    }
});

console.log('[NPC System] ✅ Система NPC загружена');