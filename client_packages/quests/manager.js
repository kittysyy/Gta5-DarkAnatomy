// Quest Manager - Client-side
// Handles quest events from server

// Handle quest start event
mp.events.add('quest:start', (questDataJson) => {
    try {
        const questData = JSON.parse(questDataJson);
        
        // Show notification
        mp.game.graphics.notify(`~g~Quest Started:~s~ ${questData.title}`);
        
        console.log('[Quests] Quest started:', questData.questId);
    } catch (error) {
        console.error('[Quests] Error handling quest:start:', error);
    }
});

// Handle quest update event
mp.events.add('quest:update', (questDataJson) => {
    try {
        const questData = JSON.parse(questDataJson);
        
        // Show notification
        mp.game.graphics.notify(`~b~Quest Updated:~s~ Step ${questData.step}`);
        
        console.log('[Quests] Quest updated:', questData.questId, 'Step:', questData.step);
    } catch (error) {
        console.error('[Quests] Error handling quest:update:', error);
    }
});

// Handle quest complete event
mp.events.add('quest:complete', (questDataJson) => {
    try {
        const questData = JSON.parse(questDataJson);
        
        // Show notification with reward
        let rewardText = '';
        if (questData.reward && questData.reward.money) {
            rewardText = `~g~+$${questData.reward.money}`;
        }
        
        mp.game.graphics.notify(`~y~Quest Completed:~s~ ${questData.title} ${rewardText}`);
        
        console.log('[Quests] Quest completed:', questData.questId);
    } catch (error) {
        console.error('[Quests] Error handling quest:complete:', error);
    }
});

// Handle load quests event (when player connects)
mp.events.add('quest:loadQuests', (questsDataJson) => {
    try {
        const quests = JSON.parse(questsDataJson);
        
        if (quests.length > 0) {
            mp.game.graphics.notify(`~b~You have ${quests.length} active quest(s)`);
        }
        
        console.log('[Quests] Loaded active quests:', quests.length);
    } catch (error) {
        console.error('[Quests] Error handling quest:loadQuests:', error);
    }
});

console.log('[Quests] Client quest manager initialized');
