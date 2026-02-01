// ===== ОПРЕДЕЛЕНИЯ КВЕСТОВ =====
// Полная система с цепочками, маркерами и разными наградами

const quests = {
    // ===== ВСТУПИТЕЛЬНАЯ ЦЕПОЧКА =====
    intro_01: {
        id: 'intro_01',
        title: 'Добро пожаловать в Los Santos',
        description: 'Добро пожаловать! Отправляйтесь в ближайший магазин 24/7 и купите бутылку воды.',
        giver: 'Welcome Guide',
        category: 'main', // main, side, daily
        level: 1, // минимальный уровень
        reward: {
            money: 500,
            exp: 100,
            items: [
                { itemId: 'phone', amount: 1 }
            ]
        },
        steps: 2,
        objectives: [
            { type: 'go_to', description: 'Идите в магазин 24/7', x: 25.7, y: -1347.3, z: 29.49, radius: 3.0 },
            { type: 'buy_item', description: 'Купите воду', itemId: 'water', amount: 1 }
        ],
        nextQuest: 'intro_02', // следующий квест в цепочке
        marker: {
            x: 25.7,
            y: -1347.3,
            z: 29.49,
            color: [255, 193, 7, 150], // желтый
            blipSprite: 1,
            blipColor: 5
        }
    },
    
    intro_02: {
        id: 'intro_02',
        title: 'Первые шаги',
        description: 'Отлично! Теперь давайте найдём вам работу. Поговорите с координатором работ.',
        giver: 'Welcome Guide',
        category: 'main',
        level: 1,
        requires: 'intro_01', // требуется выполнить сначала
        reward: {
            money: 750,
            exp: 150
        },
        steps: 1,
        objectives: [
            { type: 'talk_to_npc', description: 'Поговорите с координатором работ', npcId: 5 }
        ],
        nextQuest: 'intro_03',
        marker: {
            x: -275.0,
            y: -956.5,
            z: 31.22,
            color: [255, 193, 7, 150],
            blipSprite: 1,
            blipColor: 5
        }
    },
    
    intro_03: {
        id: 'intro_03',
        title: 'Деньги не пахнут',
        description: 'Заработайте свои первые $1000 любым способом.',
        giver: 'Координатор работ',
        category: 'main',
        level: 1,
        requires: 'intro_02',
        reward: {
            money: 1000,
            exp: 250,
            reputation: { faction: 'city', amount: 10 }
        },
        steps: 1,
        objectives: [
            { type: 'earn_money', description: 'Заработайте $1000', amount: 1000 }
        ],
        nextQuest: null // конец цепочки
    },
    
    // ===== ПОБОЧНЫЕ КВЕСТЫ =====
    side_delivery_01: {
        id: 'side_delivery_01',
        title: 'Срочная доставка',
        description: 'Доставьте посылку в указанное место. Время ограничено!',
        giver: 'Почтальон',
        category: 'side',
        level: 2,
        reward: {
            money: 300,
            exp: 75
        },
        steps: 2,
        objectives: [
            { type: 'pickup_item', description: 'Заберите посылку', x: -100.0, y: -1050.0, z: 27.0 },
            { type: 'deliver_item', description: 'Доставьте посылку', x: 150.0, y: -1000.0, z: 29.0, timeLimit: 300 }
        ],
        marker: {
            x: -100.0,
            y: -1050.0,
            z: 27.0,
            color: [33, 150, 243, 150],
            blipSprite: 478,
            blipColor: 3
        }
    },
    
    side_collect_01: {
        id: 'side_collect_01',
        title: 'Сбор материалов',
        description: 'Соберите 5 единиц металлолома для мастерской.',
        giver: 'Механик',
        category: 'side',
        level: 3,
        reward: {
            money: 500,
            exp: 100,
            items: [
                { itemId: 'toolkit', amount: 1 }
            ]
        },
        steps: 1,
        objectives: [
            { type: 'collect_item', description: 'Соберите металлолом', itemId: 'scrap_metal', amount: 5 }
        ]
    },
    
    // ===== ЕЖЕДНЕВНЫЕ КВЕСТЫ =====
    daily_fish_01: {
        id: 'daily_fish_01',
        title: 'Улов дня',
        description: 'Поймайте 3 рыбы любого вида.',
        giver: 'Рыбак',
        category: 'daily',
        level: 1,
        daily: true, // можно повторять каждый день
        reward: {
            money: 200,
            exp: 50
        },
        steps: 1,
        objectives: [
            { type: 'fish', description: 'Поймайте 3 рыбы', amount: 3 }
        ]
    },
    
    daily_drive_01: {
        id: 'daily_drive_01',
        title: 'Таксист дня',
        description: 'Выполните 5 заказов такси.',
        giver: 'Диспетчер такси',
        category: 'daily',
        level: 2,
        daily: true,
        reward: {
            money: 400,
            exp: 100
        },
        steps: 1,
        objectives: [
            { type: 'taxi_orders', description: 'Выполните 5 заказов', amount: 5 }
        ]
    },
    
    // ===== КВЕСТЫ ФРАКЦИЙ =====
    police_patrol_01: {
        id: 'police_patrol_01',
        title: 'Патрулирование',
        description: 'Проведите патрулирование по 5 контрольным точкам города.',
        giver: 'Шериф',
        category: 'faction',
        level: 5,
        factionRequired: 'police',
        reward: {
            money: 800,
            exp: 200,
            reputation: { faction: 'police', amount: 25 }
        },
        steps: 5,
        objectives: [
            { type: 'go_to', description: 'Точка 1: Центр', x: -200.0, y: -800.0, z: 30.0, radius: 5.0 },
            { type: 'go_to', description: 'Точка 2: Пляж', x: -1200.0, y: -1500.0, z: 4.0, radius: 5.0 },
            { type: 'go_to', description: 'Точка 3: Порт', x: 800.0, y: -3000.0, z: 6.0, radius: 5.0 },
            { type: 'go_to', description: 'Точка 4: Аэропорт', x: -1000.0, y: -2700.0, z: 14.0, radius: 5.0 },
            { type: 'go_to', description: 'Точка 5: Участок', x: 450.0, y: -980.0, z: 30.0, radius: 5.0 }
        ],
        marker: {
            x: -200.0,
            y: -800.0,
            z: 30.0,
            color: [33, 150, 243, 150],
            blipSprite: 60,
            blipColor: 38
        }
    }
};

// Получить квест по ID
function getQuest(questId) {
    return quests[questId] || null;
}

// Получить все квесты категории
function getQuestsByCategory(category) {
    return Object.values(quests).filter(q => q.category === category);
}

// Получить доступные квесты для игрока
function getAvailableQuests(playerLevel, completedQuests = [], playerFaction = null) {
    return Object.values(quests).filter(quest => {
        // Проверка уровня
        if (quest.level > playerLevel) return false;
        
        // Проверка требований
        if (quest.requires && !completedQuests.includes(quest.requires)) return false;
        
        // Проверка фракции
        if (quest.factionRequired && quest.factionRequired !== playerFaction) return false;
        
        // Уже выполнен (и не daily)
        if (completedQuests.includes(quest.id) && !quest.daily) return false;
        
        return true;
    });
}

module.exports = quests;
module.exports.getQuest = getQuest;
module.exports.getQuestsByCategory = getQuestsByCategory;
module.exports.getAvailableQuests = getAvailableQuests;