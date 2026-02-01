// ===== PLAYER MENU SCRIPT =====

let playerData = {};
let skillsData = {};

// ===== LOAD DATA =====
function loadPlayerData(dataJson) {
    try {
        playerData = JSON.parse(dataJson);
        updateUI();
    } catch (e) {
        console.error('Error loading player data:', e);
    }
}

function loadSkillsData(dataJson) {
    try {
        skillsData = JSON.parse(dataJson);
        updateSkillsUI();
    } catch (e) {
        console.error('Error loading skills data:', e);
    }
}

// ===== UPDATE UI =====
function updateUI() {
    // Name & ID
    document.getElementById('playerName').textContent = playerData.name || 'Неизвестно';
    document.getElementById('playerId').textContent = playerData.id || 0;
    document.getElementById('playerAvatar').innerHTML = `<span style="font-size: 32px;">${(playerData.name || 'U')[0]}</span>`;

    // Level & Exp
    const level = playerData.level || 1;
    const exp = playerData.exp || 0;
    const maxExp = level * 1000;
    const expPercent = Math.min((exp / maxExp) * 100, 100);

    document.getElementById('playerLevel').textContent = level;
    document.getElementById('levelNum').textContent = level;
    document.getElementById('currentExp').textContent = exp.toLocaleString();
    document.getElementById('maxExp').textContent = maxExp.toLocaleString();
    document.getElementById('expFill').style.width = expPercent + '%';

    // Stats
    document.getElementById('playerAge').textContent = (playerData.age || 25) + ' лет';
    document.getElementById('playerGender').textContent = playerData.gender === 'female' ? 'Женский' : 'Мужской';
    document.getElementById('playTime').textContent = formatPlayTime(playerData.playTime || 0);
    document.getElementById('regDate').textContent = playerData.regDate || 'Неизвестно';

    // Faction
    if (playerData.faction && playerData.faction.name) {
        document.getElementById('factionName').textContent = playerData.faction.name;
        document.getElementById('factionRank').textContent = playerData.faction.rank || '';
        document.getElementById('factionIcon').className = 'fas ' + getFactionIcon(playerData.faction.id);
    } else {
        document.getElementById('factionName').textContent = 'Нет фракции';
        document.getElementById('factionRank').textContent = '';
    }

    // Job
    if (playerData.job && playerData.job.name) {
        document.getElementById('jobName').textContent = playerData.job.name;
        document.getElementById('jobSalary').textContent = '$' + (playerData.job.salary || 0).toLocaleString() + '/час';
        document.getElementById('jobIcon').className = 'fas ' + getJobIcon(playerData.job.id);
    } else {
        document.getElementById('jobName').textContent = 'Безработный';
        document.getElementById('jobSalary').textContent = '';
    }

    // Money
    document.getElementById('playerCash').textContent = '$' + (playerData.cash || 0).toLocaleString();
    document.getElementById('playerBank').textContent = '$' + (playerData.bank || 0).toLocaleString();

    // Skill points
    document.getElementById('skillPoints').textContent = playerData.skillPoints || 0;
}

function updateSkillsUI() {
    for (const [skillId, level] of Object.entries(skillsData)) {
        const levelEl = document.getElementById(skillId + '_level');
        if (levelEl) {
            levelEl.textContent = level;
        }

        const node = document.querySelector(`[data-skill="${skillId}"]`);
        if (node) {
            node.classList.remove('locked', 'unlocked', 'maxed');
            
            if (level >= 5) {
                node.classList.add('maxed');
            } else if (level > 0) {
                node.classList.add('unlocked');
            }
        }
    }

    // Check locked skills
    document.querySelectorAll('.skill-node[data-requires]').forEach(node => {
        const requires = node.dataset.requires;
        if (requires) {
            const [reqSkill, reqLevel] = requires.split(':');
            const currentReqLevel = skillsData[reqSkill] || 0;
            
            if (currentReqLevel >= parseInt(reqLevel)) {
                node.classList.remove('locked');
                node.querySelector('.skill-lock')?.remove();
            } else {
                node.classList.add('locked');
            }
        }
    });
}

// ===== TABS =====
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    event.target.closest('.tab-btn').classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// ===== SKILLS =====
function upgradeSkill(skillId) {
    const node = document.querySelector(`[data-skill="${skillId}"]`);
    
    if (node.classList.contains('locked')) {
        showNotification('error', 'Навык заблокирован!');
        return;
    }

    const currentLevel = skillsData[skillId] || 0;
    if (currentLevel >= 5) {
        showNotification('warning', 'Навык уже максимального уровня!');
        return;
    }

    const cost = parseInt(node.dataset.cost) || 1;
    const skillPoints = playerData.skillPoints || 0;

    if (skillPoints < cost) {
        showNotification('error', `Недостаточно очков навыков! (нужно ${cost})`);
        return;
    }

    if (typeof mp !== 'undefined') {
        mp.trigger('cef:upgradeSkill', skillId, cost);
    }
}

function skillUpgraded(skillId, newLevel, remainingPoints) {
    skillsData[skillId] = newLevel;
    playerData.skillPoints = remainingPoints;
    
    document.getElementById('skillPoints').textContent = remainingPoints;
    updateSkillsUI();
    
    showNotification('success', 'Навык улучшен!');
}

// ===== HELPERS =====
function formatPlayTime(minutes) {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return minutes + ' мин';
    return hours + ' ч ' + (minutes % 60) + ' мин';
}

function getFactionIcon(factionId) {
    const icons = {
        1: 'fa-shield-alt',     // Police
        2: 'fa-ambulance',      // EMS
        3: 'fa-gavel',          // Government
        4: 'fa-skull',          // Mafia
        5: 'fa-cannabis',       // Gang
    };
    return icons[factionId] || 'fa-users';
}

function getJobIcon(jobId) {
    const icons = {
        1: 'fa-taxi',           // Taxi
        2: 'fa-truck',          // Trucker
        3: 'fa-bus',            // Bus Driver
        4: 'fa-hard-hat',       // Miner
        5: 'fa-tree',           // Lumberjack
        6: 'fa-fish',           // Fisher
        7: 'fa-concierge-bell', // Waiter
    };
    return icons[jobId] || 'fa-briefcase';
}

function showNotification(type, message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'notification ' + type;
    notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'exclamation'}"></i> ${message}`;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ff9800'};
    `;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 3000);
}

// ===== QUESTS SYSTEM =====
let questsData = {
    active: [],
    completed: []
};
let currentFilter = 'all';
let trackedQuestId = null;

// Update quests data from server
function updateQuestsData(data) {
    questsData = data;
    renderQuests();
}

// Filter quests by category
function filterQuests(category) {
    currentFilter = category;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        }
    });
    
    renderQuests();
}

// Render quests in UI
function renderQuests() {
    const activeList = document.getElementById('activeQuestsList');
    const completedList = document.getElementById('completedQuestsList');
    const noActive = document.getElementById('noActiveQuests');
    const noCompleted = document.getElementById('noCompletedQuests');
    
    // Filter quests
    let filteredActive = questsData.active;
    let filteredCompleted = questsData.completed;
    
    if (currentFilter !== 'all') {
        filteredActive = questsData.active.filter(q => q.category === currentFilter);
        filteredCompleted = questsData.completed.filter(q => q.category === currentFilter);
    }
    
    // Update counts
    document.getElementById('activeQuestsCount').textContent = questsData.active.length;
    document.getElementById('completedQuestsCount').textContent = questsData.completed.length;
    
    // Render active quests
    activeList.innerHTML = '';
    if (filteredActive.length > 0) {
        filteredActive.forEach(quest => {
            activeList.innerHTML += createQuestCard(quest, false);
        });
    } else {
        const noQuestsEl = document.createElement('div');
        noQuestsEl.className = 'no-quests';
        noQuestsEl.id = 'noActiveQuests';
        noQuestsEl.innerHTML = `
            <i class="fas fa-inbox"></i>
            <p>Нет активных заданий</p>
            <span>Поговорите с NPC чтобы получить задание</span>
        `;
        activeList.appendChild(noQuestsEl);
    }
    
    // Render completed quests
    completedList.innerHTML = '';
    if (filteredCompleted.length > 0) {
        filteredCompleted.forEach(quest => {
            completedList.innerHTML += createQuestCard(quest, true);
        });
    } else {
        const noQuestsEl = document.createElement('div');
        noQuestsEl.className = 'no-quests';
        noQuestsEl.id = 'noCompletedQuests';
        noQuestsEl.innerHTML = `
            <i class="fas fa-medal"></i>
            <p>Нет выполненных заданий</p>
            <span>Выполняйте задания чтобы получать награды</span>
        `;
        completedList.appendChild(noQuestsEl);
    }
}

// Get category info
function getCategoryInfo(category) {
    const categories = {
        main: { icon: 'fa-exclamation-circle', name: 'Сюжет', color: 'main' },
        side: { icon: 'fa-map-signs', name: 'Побочный', color: 'side' },
        daily: { icon: 'fa-calendar-day', name: 'Ежедневный', color: 'daily' },
        faction: { icon: 'fa-users', name: 'Фракция', color: 'faction' }
    };
    return categories[category] || { icon: 'fa-scroll', name: 'Квест', color: 'side' };
}

// Create quest card HTML
function createQuestCard(quest, isCompleted) {
    const progress = quest.steps > 0 ? Math.round((quest.step / quest.steps) * 100) : 0;
    const categoryInfo = getCategoryInfo(quest.category);
    const isTracked = trackedQuestId === quest.questId;
    
    // Build rewards HTML
    let rewardsHtml = '';
    if (quest.reward) {
        if (quest.reward.money) {
            rewardsHtml += `<div class="quest-reward-item money"><i class="fas fa-dollar-sign"></i> ${quest.reward.money}</div>`;
        }
        if (quest.reward.exp) {
            rewardsHtml += `<div class="quest-reward-item exp"><i class="fas fa-star"></i> ${quest.reward.exp} XP</div>`;
        }
        if (quest.reward.items && quest.reward.items.length > 0) {
            rewardsHtml += `<div class="quest-reward-item items"><i class="fas fa-gift"></i> ${quest.reward.items.length} предмет(ов)</div>`;
        }
    }
    
    return `
        <div class="quest-card ${isCompleted ? 'completed' : ''} ${isTracked ? 'tracked' : ''}" data-quest-id="${quest.questId}" data-category="${quest.category}">
            <div class="quest-card-header">
                <div class="quest-card-header-left">
                    <div class="quest-title-row">
                        <span class="quest-category ${categoryInfo.color}">
                            <i class="fas ${categoryInfo.icon}"></i> ${categoryInfo.name}
                        </span>
                        <span class="quest-title">${quest.title}</span>
                    </div>
                    <div class="quest-giver">
                        <i class="fas fa-user"></i> ${quest.giver || 'Неизвестно'}
                    </div>
                </div>
                <div class="quest-status ${isCompleted ? 'completed' : 'active'}">
                    ${isCompleted ? '<i class="fas fa-check"></i> Выполнено' : '<i class="fas fa-hourglass-half"></i> В процессе'}
                </div>
            </div>
            
            ${!isCompleted && quest.currentObjective ? `
                <div class="quest-objective">
                    <i class="fas fa-crosshairs"></i>
                    <span class="quest-objective-text">${quest.currentObjective}</span>
                </div>
            ` : ''}
            
            <div class="quest-description">${quest.description}</div>
            
            ${!isCompleted ? `
                <div class="quest-progress">
                    <div class="quest-progress-header">
                        <span class="quest-progress-label">Прогресс</span>
                        <span class="quest-progress-value">${quest.step}/${quest.steps}</span>
                    </div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            ` : ''}
            
            <div class="quest-footer">
                <div class="quest-rewards">
                    ${rewardsHtml}
                </div>
                ${!isCompleted ? `
                    <div class="quest-actions">
                        <button class="quest-action-btn track ${isTracked ? 'active' : ''}" onclick="toggleTrackQuest('${quest.questId}')" title="Отслеживать">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                        <button class="quest-action-btn waypoint" onclick="setQuestWaypoint('${quest.questId}')" title="Проложить маршрут">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Toggle quest tracking
function toggleTrackQuest(questId) {
    if (trackedQuestId === questId) {
        trackedQuestId = null;
        if (typeof mp !== 'undefined') {
            mp.trigger('quest:untrack');
        }
        showNotification('info', 'Отслеживание отключено');
    } else {
        trackedQuestId = questId;
        if (typeof mp !== 'undefined') {
            mp.trigger('quest:track', questId);
        }
        showNotification('success', 'Квест отслеживается');
    }
    renderQuests();
}

// Set waypoint to quest objective
function setQuestWaypoint(questId) {
    if (typeof mp !== 'undefined') {
        mp.trigger('quest:setWaypoint', questId);
    }
    showNotification('success', 'Маршрут проложен');
}

// Listen for quests update from client
if (typeof mp !== 'undefined') {
    mp.events.add('playerMenu:updateQuests', (questsJson) => {
        try {
            const data = JSON.parse(questsJson);
            updateQuestsData(data);
        } catch (e) {
            console.error('Error parsing quests data:', e);
        }
    });
}

console.log('[PlayerMenu] ✅ Quests system loaded');

// ===== CLOSE =====
function closeMenu() {
    if (typeof mp !== 'undefined') mp.trigger('cef:closePlayerMenu');
}

// ===== KEYBOARD =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenu();
    }
});

console.log('[PlayerMenu] ✅ Script loaded');