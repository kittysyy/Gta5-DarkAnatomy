const { initializeDatabase } = require('./database');
const { 
    assignQuest, 
    updateQuestStep, 
    updateQuestProgress,
    completeQuest, 
    loadPlayerQuests, 
    openQuestDialog, 
    getPlayerQuestsForMenu,
    getActiveQuestWithMarker,  // <-- ДОБАВЛЕНО
    hasActiveQuest
} = require('./manager');

// Initialize database on server start
initializeDatabase();

// Handle character loaded event - load player's active quests
mp.events.add('character:loaded', async (player, characterId) => {
    try {
        if (!player.characterId) {
            return;
        }

        const activeQuests = await loadPlayerQuests(player);
        
        if (activeQuests.length > 0) {
            player.call('quest:loadQuests', [JSON.stringify(activeQuests)]);
            console.log(`[Quests] Loaded ${activeQuests.length} active quests for player ${player.name}`);
            
            // Отправляем маркер для первого квеста
            const questWithMarker = await getActiveQuestWithMarker(player);
            if (questWithMarker && questWithMarker.marker) {
                player.call('quest:setMarker', [JSON.stringify(questWithMarker.marker)]);
            }
        }
    } catch (error) {
        console.error('[Quests] Error in character:loaded event:', error);
    }
});

// Handle quest accept from client
mp.events.add('quest:accept', async (player, questId) => {
    try {
        if (!player.characterId) {
            player.call('client:notify', ['error', 'Quest', 'You must have a character loaded!', 3000]);
            return;
        }

        const success = await assignQuest(player, questId);
        
        if (success) {
            player.call('client:notify', ['success', 'Quest', 'Quest accepted!', 3000]);
        } else {
            player.call('client:notify', ['error', 'Quest', 'Could not accept quest!', 3000]);
        }
    } catch (error) {
        console.error('[Quests] Error in quest:accept event:', error);
        player.call('client:notify', ['error', 'Quest', 'An error occurred!', 3000]);
    }
});

// Handle request for quests data (for player menu)
mp.events.add('quests:getForMenu', async (player) => {
    try {
        if (!player.characterId) {
            player.call('playerMenu:updateQuests', [JSON.stringify({ active: [], completed: [] })]);
            return;
        }

        const questsData = await getPlayerQuestsForMenu(player);
        player.call('playerMenu:updateQuests', [JSON.stringify(questsData)]);
        
        console.log(`[Quests] Sent ${questsData.active.length} active, ${questsData.completed.length} completed quests to ${player.name}`);
    } catch (error) {
        console.error('[Quests] Error in quests:getForMenu:', error);
        player.call('playerMenu:updateQuests', [JSON.stringify({ active: [], completed: [] })]);
    }
});

// Запрос маркера для активного квеста
mp.events.add('quest:requestMarker', async (player) => {
    try {
        if (!player.characterId) return;
        
        const activeQuest = await getActiveQuestWithMarker(player);
        if (activeQuest && activeQuest.marker) {
            player.call('quest:setMarker', [JSON.stringify(activeQuest.marker)]);
        }
    } catch (error) {
        console.error('[Quests] Error requesting marker:', error);
    }
});

// Установка маршрута к цели квеста
mp.events.add('quest:setWaypointToQuest', async (player, questId) => {
    try {
        if (!player.characterId) return;
        
        const quests = require('./definitions');
        const quest = quests[questId];
        
        if (!quest) return;
        
        // Получаем текущий шаг
        const { db } = require('../database');
        const [rows] = await db.query(
            'SELECT step FROM character_quests WHERE character_id = ? AND quest_id = ? AND status = 0',
            [player.characterId, questId]
        );
        
        if (rows.length === 0) return;
        
        const step = rows[0].step;
        const objective = quest.objectives?.[step];
        
        if (objective && objective.x !== undefined) {
            player.call('quest:setWaypoint', [objective.x, objective.y]);
        } else if (quest.marker) {
            player.call('quest:setWaypoint', [quest.marker.x, quest.marker.y]);
        }
    } catch (error) {
        console.error('[Quests] Error setting waypoint:', error);
    }
});

// Отслеживание квеста
mp.events.add('quest:trackQuest', async (player, questId) => {
    try {
        if (!player.characterId) return;
        
        const quests = require('./definitions');
        const quest = quests[questId];
        
        if (!quest) return;
        
        // Получаем текущий шаг
        const { db } = require('../database');
        const [rows] = await db.query(
            'SELECT step FROM character_quests WHERE character_id = ? AND quest_id = ? AND status = 0',
            [player.characterId, questId]
        );
        
        if (rows.length === 0) return;
        
        const step = rows[0].step;
        const objective = quest.objectives?.[step];
        
        // Отправляем данные для трекера
        player.call('quest:trackUpdate', [JSON.stringify({
            questId: questId,
            title: quest.title,
            step: step,
            steps: quest.steps,
            objective: objective?.description || quest.description,
            marker: objective?.x !== undefined ? {
                x: objective.x,
                y: objective.y,
                z: objective.z,
                blipSprite: quest.marker?.blipSprite || 1,
                blipColor: quest.marker?.blipColor || 5
            } : quest.marker
        })]);
        
        console.log(`[Quests] Player ${player.name} is now tracking quest ${questId}`);
    } catch (error) {
        console.error('[Quests] Error tracking quest:', error);
    }
});

// Export functions for use by other systems (e.g., NPC system)
global.questSystem = {
    openQuestDialog,
    assignQuest,
    updateQuestStep,
    updateQuestProgress,
    completeQuest,
    getPlayerQuestsForMenu,
    getActiveQuestWithMarker,
    hasActiveQuest
};

// Test command to show quest dialog
mp.events.addCommand('testquest', async (player) => {
    try {
        if (!player.characterId) {
            player.outputChatBox('You must have a character loaded!');
            return;
        }
        
        const success = await openQuestDialog(player, 'intro_01');
        if (success) {
            player.outputChatBox('Opening quest dialog...');
        } else {
            player.outputChatBox('Could not open quest dialog!');
        }
    } catch (error) {
        console.error('[Quests] Error in testquest command:', error);
    }
});

// Test command to complete quest
mp.events.addCommand('completequest', async (player, questId) => {
    try {
        if (!player.characterId) {
            player.outputChatBox('You must have a character loaded!');
            return;
        }
        
        if (!questId) {
            player.outputChatBox('Usage: /completequest [questId]');
            return;
        }
        
        const success = await completeQuest(player, questId);
        if (success) {
            player.outputChatBox(`Quest ${questId} completed!`);
        } else {
            player.outputChatBox(`Could not complete quest ${questId}!`);
        }
    } catch (error) {
        console.error('[Quests] Error in completequest command:', error);
    }
});

mp.events.add('quest:reachedObjective', async (player) => {
    try {
        if (!player.characterId) return;
        
        const { db } = require('../database');
        const quests = require('./definitions');
        
        // Получаем активный квест
        const [rows] = await db.query(
            'SELECT quest_id, step FROM character_quests WHERE character_id = ? AND status = 0 ORDER BY id ASC LIMIT 1',
            [player.characterId]
        );
        
        if (rows.length === 0) return;
        
        const questId = rows[0].quest_id;
        const currentStep = rows[0].step;
        const quest = quests[questId];
        
        if (!quest) return;
        
        const objective = quest.objectives?.[currentStep];
        
        // Проверяем тип objective
        if (objective && objective.type === 'go_to') {
            // Переходим к следующему шагу
            await updateQuestStep(player, questId, currentStep + 1);
            
            player.outputChatBox(`!{#4caf50}[Квест] Цель достигнута! ${currentStep + 1}/${quest.steps}`);
            
            // Если это был последний шаг - квест завершится автоматически в updateQuestStep
        }
    } catch (error) {
        console.error('[Quests] Error in quest:reachedObjective:', error);
    }
});

console.log('[Quests] Quest system initialized');