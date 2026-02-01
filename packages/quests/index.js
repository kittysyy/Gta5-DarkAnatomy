const { initializeDatabase } = require('./database');
const { assignQuest, updateQuestStep, completeQuest, loadPlayerQuests, openQuestDialog } = require('./manager');

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

// Export functions for use by other systems (e.g., NPC system)
global.questSystem = {
    openQuestDialog,
    assignQuest,
    updateQuestStep,
    completeQuest
};

console.log('[Quests] Quest system initialized');
