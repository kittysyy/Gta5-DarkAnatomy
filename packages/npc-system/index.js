// ===== СЕРВЕРНАЯ СИСТЕМА NPC =====
// Управление NPC для магазинов и квестов

const npcConfigs = require('./npcData');

console.log('[NPC System] ✅ Загружено NPC:', npcConfigs.length);

// ===== ОТПРАВКА ДАННЫХ NPC КЛИЕНТУ ПРИ СПАВНЕ =====
/**
 * Событие playerReady отправляется клиентом после полной загрузки
 * Отправляем данные о всех NPC клиенту для синхронизации
 */
mp.events.add('playerReady', (player) => {
    if (!player || !mp.players.exists(player)) return;
    
    // Отправляем данные о всех NPC клиенту
    player.call('npc:sync', [JSON.stringify(npcConfigs)]);
    console.log(`[NPC System] Отправлены данные о ${npcConfigs.length} NPC игроку ${player.name}`);
});

// ===== ОБРАБОТКА ВЗАИМОДЕЙСТВИЯ С NPC =====
/**
 * Обрабатывает взаимодействие игрока с NPC
 * Проверяет расстояние и тип NPC, затем выполняет соответствующую логику
 */
mp.events.add('npc:interact', (player, npcId) => {
    if (!player || !mp.players.exists(player)) return;
    
    // Находим конфигурацию NPC
    const npcConfig = npcConfigs.find(npc => npc.id === npcId);
    if (!npcConfig) {
        console.error(`[NPC System] NPC с ID ${npcId} не найден`);
        return;
    }
    
    // Проверяем расстояние между игроком и NPC
    const npcPos = new mp.Vector3(
        npcConfig.position.x,
        npcConfig.position.y,
        npcConfig.position.z
    );
    
    const playerPos = player.position;
    const distance = playerPos.subtract(npcPos).length();
    
    // Максимальное расстояние для взаимодействия - 3 метра
    // Это на 1 метр больше клиентского порога (2 метра) для учета задержек и синхронизации позиций
    if (distance > 3.0) {
        console.log(`[NPC System] Игрок ${player.name} слишком далеко от NPC ${npcId} (${distance.toFixed(2)}м)`);
        return;
    }
    
    console.log(`[NPC System] Игрок ${player.name} взаимодействует с NPC ${npcId} (${npcConfig.name})`);
    
    // Обработка в зависимости от типа NPC
    switch (npcConfig.type) {
        case 'shop':
            handleShopNPC(player, npcConfig);
            break;
            
        case 'quest':
            handleQuestNPC(player, npcConfig);
            break;
            
        default:
            console.log(`[NPC System] Неизвестный тип NPC: ${npcConfig.type}`);
            player.outputChatBox(`!{#ff9800}[${npcConfig.name}] Взаимодействие пока в разработке`);
    }
});

// ===== ОБРАБОТЧИКИ ДЛЯ РАЗНЫХ ТИПОВ NPC =====

/**
 * Обрабатывает взаимодействие с NPC магазина
 */
function handleShopNPC(player, npcConfig) {
    const shopData = npcConfig.data;
    const shopName = shopData.shopName || 'Магазин';
    const shopType = shopData.shopType || 'general';
    
    // Placeholder log for shop UI integration
    console.log('[NPC System] Opening shop...');
    
    // Отправляем сообщение игроку
    player.outputChatBox(`!{#4caf50}[${npcConfig.name}] Добро пожаловать в ${shopName}!`);
    player.outputChatBox(`!{#2196f3}[Система] Открыт магазин типа: ${shopType}`);
    
    // TODO: Здесь можно добавить логику открытия UI магазина
    // Например: player.call('shop:open', [shopType, JSON.stringify(shopData)]);
    
    console.log(`[NPC System] Магазин "${shopName}" открыт для игрока ${player.name}`);
}

/**
 * Обрабатывает взаимодействие с NPC квестодателя
 */
function handleQuestNPC(player, npcConfig) {
    const questData = npcConfig.data;
    const questId = questData.questId || 'unknown';
    const questName = questData.questName || 'Unknown Quest';
    
    // Send message to player
    player.outputChatBox(`!{#9c27b0}[${npcConfig.name}] I have a task for you...`);
    
    // Use the quest system to open quest dialog
    if (global.questSystem && typeof global.questSystem.openQuestDialog === 'function') {
        global.questSystem.openQuestDialog(player, questId);
        console.log(`[NPC System] Opened quest dialog "${questName}" for player ${player.name}`);
    } else {
        // Fallback if quest system is not loaded
        player.outputChatBox(`!{#2196f3}[System] Quest started: ${questName} (ID: ${questId})`);
        console.log(`[NPC System] Quest system not available, using fallback for quest "${questName}"`);
    }
}

console.log('[NPC System] ✅ Серверная система NPC инициализирована');
