// ===== СЕРВЕРНАЯ СИСТЕМА NPC =====
const npcConfigs = require('./npcData');

let spawnedNPCs = [];

function spawnAllNPCs() {
    console.log('[NPC System] Создаём NPC...');
    
    npcConfigs.forEach(npc => {
        try {
            // Правильный синтаксис для RAGE:MP
            const ped = mp.peds.new(
                mp.joaat(npc.model),
                new mp.Vector3(npc.position.x, npc.position.y, npc.position.z),
                npc.position.h,  // heading - отдельный параметр!
                0                // dimension
            );
            
            // Синхронизируемые переменные
            ped.setVariable('npcId', npc.id);
            ped.setVariable('npcType', npc.type);
            ped.setVariable('npcName', npc.name);
            
            // Локальные данные
            ped.npcData = npc.data;
            
            spawnedNPCs.push(ped);
            
            console.log(`[NPC System] ✅ Создан NPC: ${npc.name} (ID: ${npc.id}) на позиции ${npc.position.x}, ${npc.position.y}, ${npc.position.z}`);
        } catch (error) {
            console.error(`[NPC System] ❌ Ошибка создания NPC ${npc.id}:`, error);
        }
    });
    
    console.log(`[NPC System] ✅ Всего создано ${spawnedNPCs.length} NPC`);
}

// Спавним при старте сервера
spawnAllNPCs();

// ===== ОБРАБОТКА ВЗАИМОДЕЙСТВИЯ =====
mp.events.add('npc:interact', (player, npcId) => {
    if (!player || !mp.players.exists(player)) return;
    
    const ped = spawnedNPCs.find(p => p.getVariable('npcId') === npcId);
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