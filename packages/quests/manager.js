const { db } = require('../database');
const quests = require('./definitions');

// ===== НАЗНАЧЕНИЕ КВЕСТА =====
async function assignQuest(player, questId) {
    try {
        if (!player.characterId) {
            console.log('[Quests] Player has no character loaded');
            return false;
        }

        const quest = quests[questId];
        if (!quest) {
            console.log(`[Quests] Quest ${questId} not found`);
            return false;
        }

        // Проверка требований
        if (quest.requires) {
            const [completed] = await db.query(
                'SELECT id FROM character_quests WHERE character_id = ? AND quest_id = ? AND status = 1',
                [player.characterId, quest.requires]
            );
            if (completed.length === 0) {
                player.call('client:notify', ['error', 'Квест', 'Сначала выполните предыдущий квест!', 3000]);
                return false;
            }
        }

        // Проверка уровня
        const [charData] = await db.query('SELECT level FROM characters WHERE id = ?', [player.characterId]);
        if (charData[0]?.level < quest.level) {
            player.call('client:notify', ['error', 'Квест', `Требуется уровень ${quest.level}!`, 3000]);
            return false;
        }

        // Проверка на уже существующий квест
        const hasActive = await hasQuest(player, questId);
        if (hasActive) {
            console.log(`[Quests] Player ${player.name} already has quest ${questId}`);
            return false;
        }

        // Добавляем квест
        await db.query(
            'INSERT INTO character_quests (character_id, quest_id, status, step, progress) VALUES (?, ?, 0, 0, ?)',
            [player.characterId, questId, JSON.stringify({})]
        );

        // Уведомляем клиента
        player.call('quest:start', [JSON.stringify({
            questId: questId,
            title: quest.title,
            description: quest.description,
            objectives: quest.objectives,
            step: 0,
            marker: quest.marker || null
        })]);

        // Создаём маркер если есть
        if (quest.marker) {
            player.call('quest:setMarker', [JSON.stringify(quest.marker)]);
        }

        console.log(`[Quests] Assigned quest ${questId} to player ${player.name}`);
        return true;
    } catch (error) {
        console.error('[Quests] Error assigning quest:', error);
        return false;
    }
}

// ===== ОБНОВЛЕНИЕ ШАГА КВЕСТА =====
async function updateQuestStep(player, questId, step) {
    try {
        if (!player.characterId) return false;

        const quest = quests[questId];
        if (!quest) return false;

        await db.query(
            'UPDATE character_quests SET step = ? WHERE character_id = ? AND quest_id = ? AND status = 0',
            [step, player.characterId, questId]
        );

        // Обновляем маркер для следующего шага
        const objective = quest.objectives?.[step];
        if (objective && (objective.x !== undefined)) {
            player.call('quest:setMarker', [JSON.stringify({
                x: objective.x,
                y: objective.y,
                z: objective.z,
                color: quest.marker?.color || [255, 193, 7, 150],
                blipSprite: quest.marker?.blipSprite || 1,
                blipColor: quest.marker?.blipColor || 5
            })]);
        }

        player.call('quest:update', [JSON.stringify({
            questId: questId,
            step: step,
            objective: objective?.description || ''
        })]);

        console.log(`[Quests] Updated quest ${questId} step to ${step} for player ${player.name}`);

        // Проверяем завершение
        if (step >= quest.steps) {
            await completeQuest(player, questId);
        }

        return true;
    } catch (error) {
        console.error('[Quests] Error updating quest step:', error);
        return false;
    }
}

// ===== ОБНОВЛЕНИЕ ПРОГРЕССА (для collect, earn и т.д.) =====
async function updateQuestProgress(player, questId, progressKey, amount) {
    try {
        if (!player.characterId) return false;

        // Получаем текущий прогресс
        const [rows] = await db.query(
            'SELECT progress, step FROM character_quests WHERE character_id = ? AND quest_id = ? AND status = 0',
            [player.characterId, questId]
        );

        if (rows.length === 0) return false;

        let progress = {};
        try {
            progress = JSON.parse(rows[0].progress || '{}');
        } catch (e) {
            progress = {};
        }

        progress[progressKey] = (progress[progressKey] || 0) + amount;

        await db.query(
            'UPDATE character_quests SET progress = ? WHERE character_id = ? AND quest_id = ? AND status = 0',
            [JSON.stringify(progress), player.characterId, questId]
        );

        // Проверяем выполнение текущего objective
        const quest = quests[questId];
        const currentStep = rows[0].step;
        const objective = quest.objectives?.[currentStep];

        if (objective && objective.amount && progress[progressKey] >= objective.amount) {
            await updateQuestStep(player, questId, currentStep + 1);
        } else {
            // Уведомляем о прогрессе
            player.call('quest:progress', [JSON.stringify({
                questId: questId,
                progressKey: progressKey,
                current: progress[progressKey],
                required: objective?.amount || 1
            })]);
        }

        return true;
    } catch (error) {
        console.error('[Quests] Error updating quest progress:', error);
        return false;
    }
}

// ===== ЗАВЕРШЕНИЕ КВЕСТА =====
async function completeQuest(player, questId) {
    try {
        if (!player.characterId) return false;

        const quest = quests[questId];
        if (!quest) {
            console.log(`[Quests] Quest ${questId} not found`);
            return false;
        }

        // Помечаем как выполненный
        await db.query(
            'UPDATE character_quests SET status = 1, completed_at = NOW() WHERE character_id = ? AND quest_id = ? AND status = 0',
            [player.characterId, questId]
        );

        // Выдаём награды
        const reward = quest.reward || {};
        let rewardText = [];

        // Деньги
        if (reward.money) {
            await db.query(
                'UPDATE characters SET money = money + ? WHERE id = ?',
                [reward.money, player.characterId]
            );
            player.money = (player.money || 0) + reward.money;
            rewardText.push(`$${reward.money}`);
        }

        // Опыт
        if (reward.exp) {
            await db.query(
                'UPDATE characters SET exp = exp + ? WHERE id = ?',
                [reward.exp, player.characterId]
            );
            rewardText.push(`${reward.exp} XP`);
            
            // Проверяем повышение уровня
            checkLevelUp(player);
        }

        // Предметы
        if (reward.items && reward.items.length > 0) {
            for (const item of reward.items) {
                await db.query(
                    'INSERT INTO character_inventory (character_id, item_id, amount, slot) VALUES (?, ?, ?, -1)',
                    [player.characterId, item.itemId, item.amount]
                );
                rewardText.push(`${item.amount}x ${item.itemId}`);
            }
        }

        // Репутация
        if (reward.reputation) {
            await db.query(
                `INSERT INTO character_reputation (character_id, faction, amount) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE amount = amount + ?`,
                [player.characterId, reward.reputation.faction, reward.reputation.amount, reward.reputation.amount]
            );
            rewardText.push(`+${reward.reputation.amount} репутации`);
        }

        // Убираем маркер
        player.call('quest:removeMarker', []);

        // Уведомляем клиента
        player.call('quest:complete', [JSON.stringify({
            questId: questId,
            title: quest.title,
            reward: reward,
            rewardText: rewardText.join(', ')
        })]);

        console.log(`[Quests] Completed quest ${questId} for player ${player.name}. Rewards: ${rewardText.join(', ')}`);

        // Автоматически даём следующий квест из цепочки
        if (quest.nextQuest) {
            setTimeout(() => {
                openQuestDialog(player, quest.nextQuest);
            }, 2000);
        }

        return true;
    } catch (error) {
        console.error('[Quests] Error completing quest:', error);
        return false;
    }
}

// ===== ПРОВЕРКА ПОВЫШЕНИЯ УРОВНЯ =====
async function checkLevelUp(player) {
    try {
        const [charData] = await db.query(
            'SELECT level, exp FROM characters WHERE id = ?',
            [player.characterId]
        );

        if (charData.length === 0) return;

        const { level, exp } = charData[0];
        const expNeeded = level * 1000;

        if (exp >= expNeeded) {
            const newLevel = level + 1;
            const remainingExp = exp - expNeeded;

            await db.query(
                'UPDATE characters SET level = ?, exp = ?, skill_points = skill_points + 1 WHERE id = ?',
                [newLevel, remainingExp, player.characterId]
            );

            player.call('client:levelUp', [newLevel]);
            console.log(`[Quests] Player ${player.name} leveled up to ${newLevel}!`);
        }
    } catch (error) {
        console.error('[Quests] Error checking level up:', error);
    }
}

// ===== ПРОВЕРКА НАЛИЧИЯ КВЕСТА =====
async function hasQuest(player, questId) {
    try {
        if (!player.characterId) return false;

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

// ===== ПРОВЕРКА АКТИВНОГО КВЕСТА =====
async function hasActiveQuest(player, questId) {
    try {
        if (!player.characterId) return false;

        const [rows] = await db.query(
            'SELECT id FROM character_quests WHERE character_id = ? AND quest_id = ? AND status = 0',
            [player.characterId, questId]
        );

        return rows.length > 0;
    } catch (error) {
        console.error('[Quests] Error checking active quest:', error);
        return false;
    }
}

// ===== ЗАГРУЗКА КВЕСТОВ ИГРОКА =====
async function loadPlayerQuests(player) {
    try {
        if (!player.characterId) return [];

        const [rows] = await db.query(
            'SELECT quest_id, status, step, progress FROM character_quests WHERE character_id = ? AND status = 0',
            [player.characterId]
        );

        const activeQuests = rows.map(row => {
            const quest = quests[row.quest_id];
            return {
                questId: row.quest_id,
                title: quest?.title || 'Unknown Quest',
                description: quest?.description || '',
                step: row.step,
                steps: quest?.steps || 1,
                objectives: quest?.objectives || [],
                currentObjective: quest?.objectives?.[row.step]?.description || '',
                marker: quest?.marker || null,
                progress: JSON.parse(row.progress || '{}')
            };
        });

        return activeQuests;
    } catch (error) {
        console.error('[Quests] Error loading player quests:', error);
        return [];
    }
}

// ===== ОТКРЫТИЕ ДИАЛОГА КВЕСТА =====
async function openQuestDialog(player, questId) {
    try {
        if (!player.characterId) return false;

        const quest = quests[questId];
        if (!quest) {
            console.log(`[Quests] Quest ${questId} not found`);
            return false;
        }

        // Проверка уже есть квест
        const hasActive = await hasQuest(player, questId);
        if (hasActive) {
            player.call('client:notify', ['warning', 'Квест', 'Вы уже взяли этот квест!', 3000]);
            return false;
        }

        player.call('quest:showDialog', [JSON.stringify({
            questId: questId,
            title: quest.title,
            description: quest.description,
            giver: quest.giver,
            category: quest.category,
            level: quest.level,
            reward: quest.reward,
            objectives: quest.objectives
        })]);

        return true;
    } catch (error) {
        console.error('[Quests] Error opening quest dialog:', error);
        return false;
    }
}

// ===== ПОЛУЧЕНИЕ КВЕСТОВ ДЛЯ МЕНЮ =====
async function getPlayerQuestsForMenu(player) {
    try {
        if (!player.characterId) {
            return { active: [], completed: [] };
        }

        const [rows] = await db.query(
            'SELECT quest_id, status, step, progress FROM character_quests WHERE character_id = ?',
            [player.characterId]
        );

        const active = [];
        const completed = [];

        rows.forEach(row => {
            const questDef = quests[row.quest_id];
            if (!questDef) return;

            const currentObjective = questDef.objectives?.[row.step];

            const questData = {
                questId: row.quest_id,
                title: questDef.title,
                description: questDef.description,
                giver: questDef.giver || 'NPC',
                category: questDef.category || 'side',
                step: row.step,
                steps: questDef.steps || 1,
                currentObjective: currentObjective?.description || '',
                reward: questDef.reward,
                progress: JSON.parse(row.progress || '{}')
            };

            if (row.status === 0) {
                active.push(questData);
            } else {
                completed.push(questData);
            }
        });

        return { active, completed };
    } catch (error) {
        console.error('[Quests] Error getting quests for menu:', error);
        return { active: [], completed: [] };
    }
}

// ===== ПОЛУЧИТЬ АКТИВНЫЙ КВЕСТ С МАРКЕРОМ =====
async function getActiveQuestWithMarker(player) {
    try {
        if (!player.characterId) return null;

        const [rows] = await db.query(
            'SELECT quest_id, step FROM character_quests WHERE character_id = ? AND status = 0 ORDER BY id ASC LIMIT 1',
            [player.characterId]
        );

        if (rows.length === 0) return null;

        const quest = quests[rows[0].quest_id];
        if (!quest) return null;

        const step = rows[0].step;
        const objective = quest.objectives?.[step];

        if (objective && objective.x !== undefined) {
            return {
                questId: quest.id,
                title: quest.title,
                objective: objective.description,
                marker: {
                    x: objective.x,
                    y: objective.y,
                    z: objective.z,
                    color: quest.marker?.color || [255, 193, 7, 150],
                    blipSprite: quest.marker?.blipSprite || 1,
                    blipColor: quest.marker?.blipColor || 5
                }
            };
        }

        return null;
    } catch (error) {
        console.error('[Quests] Error getting active quest marker:', error);
        return null;
    }
}

module.exports = {
    assignQuest,
    updateQuestStep,
    updateQuestProgress,
    completeQuest,
    hasQuest,
    hasActiveQuest,
    loadPlayerQuests,
    openQuestDialog,
    getPlayerQuestsForMenu,
    getActiveQuestWithMarker
};