const { db } = require('../database');
const quests = require('./definitions');

/**
 * Assign a quest to a player
 * @param {Object} player - The player object
 * @param {string} questId - The ID of the quest to assign
 * @returns {Promise<boolean>} - Success status
 */
async function assignQuest(player, questId) {
    try {
        if (!player.characterId) {
            console.log('[Quests] Player has no character loaded');
            return false;
        }

        // Check if quest exists
        if (!quests[questId]) {
            console.log(`[Quests] Quest ${questId} not found`);
            return false;
        }

        // Check if player already has this quest
        const hasActiveQuest = await hasQuest(player, questId);
        if (hasActiveQuest) {
            console.log(`[Quests] Player ${player.name} already has quest ${questId}`);
            return false;
        }

        // Insert quest into database
        await db.query(
            'INSERT INTO character_quests (character_id, quest_id, status, step) VALUES (?, ?, 0, 0)',
            [player.characterId, questId]
        );

        // Notify client
        player.call('quest:start', [JSON.stringify({
            questId: questId,
            title: quests[questId].title,
            description: quests[questId].description,
            step: 0
        })]);

        console.log(`[Quests] Assigned quest ${questId} to player ${player.name}`);
        return true;
    } catch (error) {
        console.error('[Quests] Error assigning quest:', error);
        return false;
    }
}

/**
 * Update quest step for a player
 * @param {Object} player - The player object
 * @param {string} questId - The ID of the quest
 * @param {number} step - The new step number
 * @returns {Promise<boolean>} - Success status
 */
async function updateQuestStep(player, questId, step) {
    try {
        if (!player.characterId) {
            return false;
        }

        await db.query(
            'UPDATE character_quests SET step = ? WHERE character_id = ? AND quest_id = ? AND status = 0',
            [step, player.characterId, questId]
        );

        // Notify client
        player.call('quest:update', [JSON.stringify({
            questId: questId,
            step: step
        })]);

        console.log(`[Quests] Updated quest ${questId} step to ${step} for player ${player.name}`);
        return true;
    } catch (error) {
        console.error('[Quests] Error updating quest step:', error);
        return false;
    }
}

/**
 * Complete a quest for a player
 * @param {Object} player - The player object
 * @param {string} questId - The ID of the quest to complete
 * @returns {Promise<boolean>} - Success status
 */
async function completeQuest(player, questId) {
    try {
        if (!player.characterId) {
            return false;
        }

        // Check if quest exists
        if (!quests[questId]) {
            console.log(`[Quests] Quest ${questId} not found`);
            return false;
        }

        // Mark quest as completed
        await db.query(
            'UPDATE character_quests SET status = 1 WHERE character_id = ? AND quest_id = ? AND status = 0',
            [player.characterId, questId]
        );

        // Give reward
        const quest = quests[questId];
        if (quest.reward && quest.reward.money) {
            // Update player money
            await db.query(
                'UPDATE characters SET money = money + ? WHERE id = ?',
                [quest.reward.money, player.characterId]
            );
            
            // Update player's money in-game
            player.money = (player.money || 0) + quest.reward.money;
        }

        // Notify client
        player.call('quest:complete', [JSON.stringify({
            questId: questId,
            title: quest.title,
            reward: quest.reward
        })]);

        console.log(`[Quests] Completed quest ${questId} for player ${player.name}`);
        return true;
    } catch (error) {
        console.error('[Quests] Error completing quest:', error);
        return false;
    }
}

/**
 * Check if player has a quest (active or completed)
 * @param {Object} player - The player object
 * @param {string} questId - The ID of the quest
 * @returns {Promise<boolean>} - True if player has the quest
 */
async function hasQuest(player, questId) {
    try {
        if (!player.characterId) {
            return false;
        }

        const [rows] = await db.query(
            'SELECT id FROM character_quests WHERE character_id = ? AND quest_id = ?',
            [player.characterId, questId]
        );

        return rows.length > 0;
    } catch (error) {
        console.error('[Quests] Error checking quest:', error);
        return false;
    }
}

/**
 * Load all active quests for a player
 * @param {Object} player - The player object
 * @returns {Promise<Array>} - Array of active quests
 */
async function loadPlayerQuests(player) {
    try {
        if (!player.characterId) {
            return [];
        }

        const [rows] = await db.query(
            'SELECT quest_id, status, step FROM character_quests WHERE character_id = ? AND status = 0',
            [player.characterId]
        );

        const activeQuests = rows.map(row => ({
            questId: row.quest_id,
            title: quests[row.quest_id]?.title || 'Unknown Quest',
            description: quests[row.quest_id]?.description || '',
            step: row.step,
            status: row.status
        }));

        return activeQuests;
    } catch (error) {
        console.error('[Quests] Error loading player quests:', error);
        return [];
    }
}

/**
 * Open quest dialog for a player
 * @param {Object} player - The player object
 * @param {string} questId - The ID of the quest
 * @returns {Promise<boolean>} - Success status
 */
async function openQuestDialog(player, questId) {
    try {
        if (!player.characterId) {
            return false;
        }

        // Check if quest exists
        if (!quests[questId]) {
            console.log(`[Quests] Quest ${questId} not found`);
            return false;
        }

        // Check if player already has this quest
        const hasActiveQuest = await hasQuest(player, questId);
        if (hasActiveQuest) {
            player.call('client:notify', ['warning', 'Quest', 'You already have this quest!', 3000]);
            return false;
        }

        const quest = quests[questId];

        // Send quest dialog to client
        player.call('quest:showDialog', [JSON.stringify({
            questId: questId,
            title: quest.title,
            description: quest.description,
            reward: quest.reward
        })]);

        return true;
    } catch (error) {
        console.error('[Quests] Error opening quest dialog:', error);
        return false;
    }
}

module.exports = {
    assignQuest,
    updateQuestStep,
    completeQuest,
    hasQuest,
    loadPlayerQuests,
    openQuestDialog
};
