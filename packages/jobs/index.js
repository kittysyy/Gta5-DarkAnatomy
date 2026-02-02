// ===== СИСТЕМА РАБОТ =====

const { db } = require('../database');

// ===== КОНФИГУРАЦИЯ =====
const LEVEL_CONFIG = {
    expPerLevel: [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000],
    maxLevel: 10
};

const COURIER_CONFIG = {
    id: 'courier',
    name: 'Курьерская служба',
    npcModel: 's_m_m_postal_01',
    npcPosition: { x: 105.5, y: -1568.0, z: 29.6, h: 220.0 },
    blipSprite: 478,
    blipColor: 5,
    blipName: 'Курьерская служба',
    
    // Транспорт для аренды
    vehicles: [
        { model: 'faggio2', name: 'Мопед Faggio', price: 50, deposit: 100, icon: '🛵', type: 'moped' },
        { model: 'bison', name: 'Пикап Bison', price: 150, deposit: 300, icon: '🛻', type: 'pickup' },
        { model: 'burrito', name: 'Фургон Burrito', price: 200, deposit: 400, icon: '🚐', type: 'van' },
        { model: 'mule', name: 'Грузовик Mule', price: 300, deposit: 600, icon: '🚚', type: 'truck' }
    ],
    vehicleSpawn: { x: 108.0, y: -1575.0, z: 29.3, h: 220.0 },
    
    // Точки погрузки
    pickupPoints: [
        { x: 71.0, y: -1393.0, z: 29.3, name: 'Склад почты' },
        { x: -56.5, y: -1752.8, z: 29.4, name: 'Магазин на Grove' },
        { x: -1222.3, y: -906.7, z: 12.3, name: 'Порт Веспуччи' },
        { x: 1136.0, y: -982.0, z: 46.4, name: 'Склад Мьюрриета' },
        { x: -324.0, y: -1545.0, z: 31.0, name: 'Торговый центр' }
    ],
    
    // Точки доставки
    deliveryPoints: [
        { x: -47.0, y: -1757.0, z: 29.4, name: 'Магазин на Grove St' },
        { x: 373.0, y: 325.0, z: 103.5, name: 'Офис Downtown' },
        { x: -1222.0, y: -906.0, z: 12.3, name: 'Пляж Веспуччи' },
        { x: 1159.0, y: -314.0, z: 69.2, name: 'Винвуд Хиллз' },
        { x: -707.0, y: -152.0, z: 37.4, name: 'Рокфорд Хиллз' },
        { x: 24.0, y: -1345.0, z: 29.5, name: 'Магазин 24/7' },
        { x: -1487.0, y: -379.0, z: 40.1, name: 'Мориньвуд' },
        { x: 1136.0, y: -982.0, z: 46.4, name: 'Мьюрриета Хайтс' },
        { x: -165.0, y: -302.0, z: 39.7, name: 'Бюро Maze Bank' },
        { x: 289.0, y: -1256.0, z: 29.4, name: 'Автомойка' },
        { x: -549.0, y: -202.0, z: 38.2, name: 'Мэрия' },
        { x: 311.0, y: -584.0, z: 43.0, name: 'Больница Pillbox' }
    ],
    
    // Типы грузов
    cargoTypes: [
        { id: 'packages', name: 'Посылки', icon: '📦', baseReward: 150 },
        { id: 'documents', name: 'Документы', icon: '📄', baseReward: 200 },
        { id: 'food', name: 'Еда', icon: '🍔', baseReward: 120 },
        { id: 'electronics', name: 'Электроника', icon: '💻', baseReward: 250 },
        { id: 'fragile', name: 'Хрупкий груз', icon: '⚠️', baseReward: 300 }
    ],
    
    levelBonuses: {
        1: { multiplier: 1.0, tip: 0, description: 'Стажёр' },
        2: { multiplier: 1.1, tip: 5, description: 'Новичок' },
        3: { multiplier: 1.2, tip: 10, description: 'Курьер' },
        4: { multiplier: 1.35, tip: 15, description: 'Опытный курьер' },
        5: { multiplier: 1.5, tip: 20, description: 'Старший курьер' },
        6: { multiplier: 1.7, tip: 30, description: 'Бригадир' },
        7: { multiplier: 1.9, tip: 40, description: 'Супервайзер' },
        8: { multiplier: 2.1, tip: 50, description: 'Менеджер доставки' },
        9: { multiplier: 2.4, tip: 65, description: 'Региональный менеджер' },
        10: { multiplier: 3.0, tip: 100, description: 'Директор логистики' }
    }
};

// Хранилище
const activeWorkers = new Map(); // playerId -> { jobId, vehicle, contract, ... }
let courierNPC = null;
let courierBlip = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
// ===== ИНИЦИАЛИЗАЦИЯ =====
function initJobSystem() {
    console.log('[Jobs] Инициализация системы работ...');
    
    // Создаём NPC курьера
    try {
        courierNPC = mp.peds.new(
            mp.joaat('s_m_m_postal_01'),
            new mp.Vector3(105.5, -1568.0, 29.6),
            220.0,
            0
        );
        
        courierNPC.setVariable('isServerNPC', true);
        courierNPC.setVariable('npcType', 'job_courier');
        courierNPC.setVariable('npcId', 'courier_npc');
        courierNPC.setVariable('npcName', 'Менеджер доставки');
        
        console.log('[Jobs] ✅ NPC курьера создан');
    } catch (err) {
        console.error('[Jobs] ❌ Ошибка создания NPC:', err);
    }
}

// Вызываем через 3 секунды после старта
setTimeout(initJobSystem, 3000);

// ===== ОТПРАВКА БЛИПА ИГРОКАМ =====
mp.events.add('playerReady', (player) => {
    setTimeout(() => {
        player.call('client:createJobBlip', [JSON.stringify({
            x: COURIER_CONFIG.npcPosition.x,
            y: COURIER_CONFIG.npcPosition.y,
            z: COURIER_CONFIG.npcPosition.z,
            sprite: COURIER_CONFIG.blipSprite,
            color: COURIER_CONFIG.blipColor,
            name: COURIER_CONFIG.blipName,
            id: 'courier'
        })]);
    }, 5000);
});

// ===== ПОЛУЧЕНИЕ ДАННЫХ О РАБОТЕ ИГРОКА =====
async function getPlayerJobData(characterId, jobId) {
    try {
        const [rows] = await db.query(
            'SELECT * FROM character_jobs WHERE character_id = ? AND job_id = ?',
            [characterId, jobId]
        );
        
        if (rows.length === 0) {
            await db.query(
                'INSERT INTO character_jobs (character_id, job_id) VALUES (?, ?)',
                [characterId, jobId]
            );
            return { level: 1, experience: 0, total_completed: 0, total_earned: 0 };
        }
        
        return rows[0];
    } catch (err) {
        console.error('[Jobs] Ошибка:', err);
        return { level: 1, experience: 0, total_completed: 0, total_earned: 0 };
    }
}

function getLevelFromExp(totalExp) {
    let level = 1;
    let expSum = 0;
    
    for (let i = 1; i < LEVEL_CONFIG.maxLevel; i++) {
        expSum += LEVEL_CONFIG.expPerLevel[i] || (i * 1000);
        if (totalExp >= expSum) {
            level = i + 1;
        } else {
            break;
        }
    }
    
    return Math.min(level, LEVEL_CONFIG.maxLevel);
}

// ===== ПОЛУЧЕНИЕ ВСЕХ РАБОТ ДЛЯ МЕНЮ =====
async function getAllPlayerJobs(characterId) {
    try {
        const [jobs] = await db.query('SELECT * FROM jobs WHERE is_active = TRUE');
        const [playerJobs] = await db.query(
            'SELECT * FROM character_jobs WHERE character_id = ?',
            [characterId]
        );
        
        const playerJobMap = {};
        playerJobs.forEach(pj => {
            playerJobMap[pj.job_id] = pj;
        });
        
        return jobs.map(job => {
            const playerData = playerJobMap[job.id] || { level: 1, experience: 0, total_completed: 0, total_earned: 0 };
            const nextLevelExp = LEVEL_CONFIG.expPerLevel[playerData.level] || 1000;
            const prevLevelExp = LEVEL_CONFIG.expPerLevel[playerData.level - 1] || 0;
            const expInLevel = playerData.experience - prevLevelExp;
            const expNeeded = nextLevelExp - prevLevelExp;
            
            return {
                id: job.id,
                name: job.name,
                icon: job.icon,
                basePay: job.base_pay,
                level: playerData.level,
                experience: playerData.experience,
                expProgress: Math.floor((expInLevel / expNeeded) * 100),
                expToNext: expNeeded - expInLevel,
                totalCompleted: playerData.total_completed,
                totalEarned: playerData.total_earned,
                bonus: COURIER_CONFIG.levelBonuses[playerData.level]
            };
        });
    } catch (err) {
        console.error('[Jobs] Ошибка получения работ:', err);
        return [];
    }
}

mp.events.add('jobs:getPlayerJobs', async (player) => {
    if (!player.characterId) return;
    const jobs = await getAllPlayerJobs(player.characterId);
    player.call('client:updatePlayerJobs', [JSON.stringify(jobs)]);
});

// ===== ВЗАИМОДЕЙСТВИЕ С NPC =====
mp.events.add('npc:interact', (player, npcId) => {
    if (npcId === 'courier_npc') {
        mp.events.call('jobs:openCourierNPC', player);
    }
});

// ===== ВЗАИМОДЕЙСТВИЕ С NPC — СНАЧАЛА ДИАЛОГ =====
mp.events.add('jobs:openCourierNPC', async (player) => {
    if (!player.characterId) return;
    
    const activeWorker = activeWorkers.get(player.id);
    
    // Открываем диалог
    player.call('client:openCourierDialog', [JSON.stringify({
        isWorking: !!activeWorker
    })]);
});

// ===== ОБРАБОТКА ВЫБОРА В ДИАЛОГЕ =====
mp.events.add('jobs:dialogOption', async (player, option) => {
    if (!player.characterId) return;
    
    console.log(`[Jobs] ${player.name} выбрал: ${option}`);
    
    switch (option) {
        case 'start':
            // Открываем меню выбора транспорта
            const jobData = await getPlayerJobData(player.characterId, 'courier');
            const bonus = COURIER_CONFIG.levelBonuses[jobData.level] || COURIER_CONFIG.levelBonuses[1];
            
            player.call('client:openCourierNPC', [JSON.stringify({
                level: jobData.level,
                experience: jobData.experience,
                rank: bonus.description,
                totalDeliveries: jobData.total_completed,
                totalEarned: jobData.total_earned,
                isWorking: false,
                vehicles: COURIER_CONFIG.vehicles,
                playerCash: player.cash || 0
            })]);
            break;
            
        case 'info':
            player.call('client:closeAllJobMenus');
            player.outputChatBox('!{#ffd700}[Менеджер] Работа простая:');
            player.outputChatBox('!{#ffffff}1. Арендуешь транспорт или используешь свой');
            player.outputChatBox('!{#ffffff}2. Открываешь планшет и берёшь контракт');
            player.outputChatBox('!{#ffffff}3. Забираешь груз и доставляешь по адресу');
            player.outputChatBox('!{#4caf50}Чем выше уровень — тем больше платят!');
            break;
            
        case 'stats':
            player.call('client:closeAllJobMenus');
            const stats = await getPlayerJobData(player.characterId, 'courier');
            const rankBonus = COURIER_CONFIG.levelBonuses[stats.level] || COURIER_CONFIG.levelBonuses[1];
            player.outputChatBox('!{#ffd700}=== Твоя статистика ===');
            player.outputChatBox(`!{#ffffff}Ранг: ${rankBonus.description} (Ур. ${stats.level})`);
            player.outputChatBox(`!{#ffffff}Доставок: ${stats.total_completed}`);
            player.outputChatBox(`!{#4caf50}Заработано: $${stats.total_earned}`);
            break;
            
        case 'tablet':
            player.call('client:closeAllJobMenus');
            setTimeout(() => {
                mp.events.call('tablet:open', player, 'deliveries');
            }, 300);
            break;
            
        case 'stop':
            player.call('client:closeAllJobMenus');
            mp.events.call('jobs:stopWork', player);
            break;
            
        case 'exit':
            player.call('client:closeAllJobMenus');
            break;
    }
});

// ===== НАЧАТЬ РАБОТУ С АРЕНДОЙ =====
mp.events.add('jobs:startCourierWithVehicle', async (player, vehicleModel) => {
    if (!player.characterId) return;
    
    if (activeWorkers.has(player.id)) {
        player.outputChatBox('!{#f44336}Вы уже работаете!');
        return;
    }
    
    // Находим транспорт
    const vehicleConfig = COURIER_CONFIG.vehicles.find(v => v.model === vehicleModel);
    if (!vehicleConfig) {
        player.outputChatBox('!{#f44336}Транспорт не найден!');
        return;
    }
    
    // Проверяем деньги
    const totalCost = vehicleConfig.price + vehicleConfig.deposit;
    if ((player.cash || 0) < totalCost) {
        player.outputChatBox(`!{#f44336}Недостаточно денег! Нужно: $${totalCost}`);
        return;
    }
    
    // Списываем деньги
    player.cash -= totalCost;
    await db.query('UPDATE characters SET money = ? WHERE id = ?', [player.cash, player.characterId]);
    player.call('client:updateHUD', [JSON.stringify({ cash: player.cash })]);
    
    // Создаём транспорт
    const spawn = COURIER_CONFIG.vehicleSpawn;
    const veh = mp.vehicles.new(
        mp.joaat(vehicleModel),
        new mp.Vector3(spawn.x, spawn.y, spawn.z),
        {
            heading: spawn.h,
            color: [[255, 140, 0], [255, 140, 0]],
            locked: false,
            engine: false
        }
    );
    
    veh.setVariable('isJobVehicle', true);
    veh.setVariable('jobOwner', player.id);
    veh.setVariable('vehicleType', vehicleConfig.type);
    
    // Сохраняем данные работника
    activeWorkers.set(player.id, {
        jobId: 'courier',
        vehicle: veh,
        vehicleType: vehicleConfig.type,
        deposit: vehicleConfig.deposit,
        contract: null,
        deliveriesCount: 0,
        startTime: Date.now()
    });
    
    // Телепорт в авто
    setTimeout(() => {
        if (veh && mp.vehicles.exists(veh)) {
            player.putIntoVehicle(veh, 0);
        }
    }, 500);
    
    player.call('client:closeCourierNPC');
    player.outputChatBox('!{#4caf50}[Работа] Вы начали работу курьером!');
    player.outputChatBox(`!{#ffff00}[Работа] Арендован: ${vehicleConfig.name}. Залог: $${vehicleConfig.deposit}`);
    player.outputChatBox('!{#00bcd4}[Работа] Откройте планшет (F3) для получения контрактов!');
    
    // Открываем планшет
    setTimeout(() => {
        player.call('client:openTablet', ['deliveries']);
    }, 1000);
    
    console.log(`[Jobs] ${player.name} начал работу курьером на ${vehicleConfig.name}`);
});

// ===== ИСПОЛЬЗОВАТЬ ЛИЧНЫЙ ТРАНСПОРТ =====
mp.events.add('jobs:startCourierOwnVehicle', async (player) => {
    if (!player.characterId) return;
    
    if (activeWorkers.has(player.id)) {
        player.outputChatBox('!{#f44336}Вы уже работаете!');
        return;
    }
    
    // Проверяем что игрок в транспорте
    if (!player.vehicle) {
        player.outputChatBox('!{#f44336}Вы должны быть в своём транспорте!');
        return;
    }
    
    const veh = player.vehicle;
    
    // Проверяем тип транспорта (упрощённо)
    const vehicleClass = veh.getVariable('vehicleClass') || 'unknown';
    const allowedTypes = ['pickup', 'van', 'truck', 'moped'];
    
    activeWorkers.set(player.id, {
        jobId: 'courier',
        vehicle: veh,
        vehicleType: 'own',
        deposit: 0,
        contract: null,
        deliveriesCount: 0,
        startTime: Date.now(),
        isOwnVehicle: true
    });
    
    player.call('client:closeCourierNPC');
    player.outputChatBox('!{#4caf50}[Работа] Вы начали работу курьером на своём транспорте!');
    player.outputChatBox('!{#00bcd4}[Работа] Откройте планшет (F3) для получения контрактов!');
    
    setTimeout(() => {
        player.call('client:openTablet', ['deliveries']);
    }, 1000);
});

// ===== ОТКРЫТЬ ПЛАНШЕТ =====
mp.events.add('tablet:open', async (player, tab) => {
    if (!player.characterId) return;
    
    const worker = activeWorkers.get(player.id);
    const jobData = await getPlayerJobData(player.characterId, 'courier');
    
    console.log(`[Jobs] Планшет для ${player.name}, isWorking: ${!!worker}`); // Добавь лог
    
    player.call('client:openTablet', [JSON.stringify({
        tab: tab || 'main',
        isWorking: !!worker,  // <-- Это должно быть true когда работаем
        jobData: {
            level: jobData.level,
            experience: jobData.experience,
            totalCompleted: jobData.total_completed,
            totalEarned: jobData.total_earned
        },
        currentContract: worker?.contract || null,
        availableContracts: worker ? generateContracts(jobData.level) : []
    })]);
});

// ===== ГЕНЕРАЦИЯ КОНТРАКТОВ =====
function generateContracts(level) {
    const contracts = [];
    const count = Math.min(3 + Math.floor(level / 2), 6);
    
    for (let i = 0; i < count; i++) {
        const pickup = COURIER_CONFIG.pickupPoints[Math.floor(Math.random() * COURIER_CONFIG.pickupPoints.length)];
        const delivery = COURIER_CONFIG.deliveryPoints[Math.floor(Math.random() * COURIER_CONFIG.deliveryPoints.length)];
        const cargo = COURIER_CONFIG.cargoTypes[Math.floor(Math.random() * COURIER_CONFIG.cargoTypes.length)];
        
        // Расчёт расстояния и награды
        const distance = Math.sqrt(
            Math.pow(delivery.x - pickup.x, 2) + 
            Math.pow(delivery.y - pickup.y, 2)
        );
        
        const bonus = COURIER_CONFIG.levelBonuses[level] || COURIER_CONFIG.levelBonuses[1];
        const baseReward = cargo.baseReward;
        const distanceBonus = Math.floor(distance / 100) * 10;
        const reward = Math.floor((baseReward + distanceBonus) * bonus.multiplier);
        
        contracts.push({
            id: `contract_${Date.now()}_${i}`,
            cargo: cargo,
            pickup: pickup,
            delivery: delivery,
            distance: Math.floor(distance),
            reward: reward,
            exp: Math.floor(15 + (distance / 100))
        });
    }
    
    return contracts;
}

// ===== ПРИНЯТЬ КОНТРАКТ =====
mp.events.add('jobs:acceptContract', async (player, contractJson) => {
    if (!player.characterId) return;
    
    const worker = activeWorkers.get(player.id);
    if (!worker) {
        player.outputChatBox('!{#f44336}Вы не работаете!');
        return;
    }
    
    if (worker.contract) {
        player.outputChatBox('!{#f44336}У вас уже есть активный контракт!');
        return;
    }
    
    try {
        const contract = JSON.parse(contractJson);
        
        // Сохраняем в БД
        const [result] = await db.query(`
            INSERT INTO delivery_contracts 
            (character_id, job_id, status, pickup_x, pickup_y, pickup_z, pickup_name, 
             delivery_x, delivery_y, delivery_z, delivery_name, cargo_type, reward)
            VALUES (?, 'courier', 'pickup', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            player.characterId,
            contract.pickup.x, contract.pickup.y, contract.pickup.z, contract.pickup.name,
            contract.delivery.x, contract.delivery.y, contract.delivery.z, contract.delivery.name,
            contract.cargo.id, contract.reward
        ]);
        
        contract.dbId = result.insertId;
        worker.contract = contract;
        
        // Отправляем метку погрузки
        player.call('client:setDeliveryWaypoint', [JSON.stringify({
            type: 'pickup',
            x: contract.pickup.x,
            y: contract.pickup.y,
            z: contract.pickup.z,
            name: contract.pickup.name,
            cargo: contract.cargo
        })]);
        
        player.call('client:closeTablet');
        player.outputChatBox(`!{#4caf50}[Контракт] Принят! Заберите ${contract.cargo.icon} ${contract.cargo.name}`);
        player.outputChatBox(`!{#ffff00}[Контракт] Точка погрузки: ${contract.pickup.name}`);
        
    } catch (err) {
        console.error('[Jobs] Ошибка принятия контракта:', err);
    }
});

// ===== ПОГРУЗКА =====
mp.events.add('jobs:pickup', async (player) => {
    if (!player.characterId) return;
    
    const worker = activeWorkers.get(player.id);
    if (!worker?.contract) return;
    
    const contract = worker.contract;
    
    // Проверяем расстояние
    const dist = player.position.subtract(
        new mp.Vector3(contract.pickup.x, contract.pickup.y, contract.pickup.z)
    ).length();
    
    if (dist > 10) {
        player.outputChatBox('!{#f44336}Вы не на точке погрузки!');
        return;
    }
    
    // Проверяем транспорт
    if (!player.vehicle && !worker.isOwnVehicle) {
        player.outputChatBox('!{#f44336}Вернитесь к рабочему транспорту!');
        return;
    }
    
    // Обновляем статус
    await db.query(
        'UPDATE delivery_contracts SET status = "delivery" WHERE id = ?',
        [contract.dbId]
    );
    
    worker.contract.status = 'delivery';
    
    // Отправляем метку доставки
    player.call('client:setDeliveryWaypoint', [JSON.stringify({
        type: 'delivery',
        x: contract.delivery.x,
        y: contract.delivery.y,
        z: contract.delivery.z,
        name: contract.delivery.name,
        cargo: contract.cargo
    })]);
    
    player.outputChatBox(`!{#4caf50}[Контракт] Груз загружен! ${contract.cargo.icon}`);
    player.outputChatBox(`!{#ffff00}[Контракт] Доставьте в: ${contract.delivery.name}`);
});

// ===== ДОСТАВКА =====
mp.events.add('jobs:deliver', async (player) => {
    if (!player.characterId) return;
    
    const worker = activeWorkers.get(player.id);
    if (!worker?.contract) return;
    
    const contract = worker.contract;
    
    if (contract.status !== 'delivery') {
        player.outputChatBox('!{#f44336}Сначала заберите груз!');
        return;
    }
    
    // Проверяем расстояние
    const dist = player.position.subtract(
        new mp.Vector3(contract.delivery.x, contract.delivery.y, contract.delivery.z)
    ).length();
    
    if (dist > 10) {
        player.outputChatBox('!{#f44336}Вы не на точке доставки!');
        return;
    }
    
    // Получаем данные и бонусы
    const jobData = await getPlayerJobData(player.characterId, 'courier');
    const bonus = COURIER_CONFIG.levelBonuses[jobData.level] || COURIER_CONFIG.levelBonuses[1];
    
    // Чаевые
    const tip = Math.floor(Math.random() * bonus.tip);
    const totalReward = contract.reward + tip;
    const exp = contract.exp || 15;
    
    // Начисляем
    player.cash = (player.cash || 0) + totalReward;
    
    const newExp = (jobData.experience || 0) + exp;
    const newLevel = getLevelFromExp(newExp);
    const leveledUp = newLevel > jobData.level;
    
    // Обновляем БД
    await db.query(`
        UPDATE character_jobs 
        SET experience = ?, level = ?, total_completed = total_completed + 1, 
            total_earned = total_earned + ?, last_work = NOW()
        WHERE character_id = ? AND job_id = 'courier'
    `, [newExp, newLevel, totalReward, player.characterId]);
    
    await db.query('UPDATE characters SET money = ? WHERE id = ?', [player.cash, player.characterId]);
    await db.query(
        'UPDATE delivery_contracts SET status = "completed", completed_at = NOW() WHERE id = ?',
        [contract.dbId]
    );
    
    // Очищаем контракт
    worker.contract = null;
    worker.deliveriesCount++;
    
    // Уведомления
    player.call('client:clearDeliveryWaypoint');
    player.call('client:updateHUD', [JSON.stringify({ cash: player.cash })]);
    
    player.outputChatBox(`!{#4caf50}[Доставка] Получено: $${contract.reward}${tip > 0 ? ` + $${tip} чаевые` : ''}`);
    player.outputChatBox(`!{#00bcd4}[Опыт] +${exp} EXP`);
    
    if (leveledUp) {
        const newBonus = COURIER_CONFIG.levelBonuses[newLevel];
        player.outputChatBox(`!{#ffd700}🎉 УРОВЕНЬ ПОВЫШЕН! Теперь вы: ${newBonus.description}`);
        player.call('client:levelUp', [newLevel, newBonus.description]);
    }
    
    // Предлагаем новый контракт
    setTimeout(() => {
        player.outputChatBox('!{#00bcd4}[Работа] Откройте планшет (F3) для нового контракта!');
    }, 2000);
});

// ===== ЗАВЕРШИТЬ РАБОТУ =====
mp.events.add('jobs:stopWork', async (player) => {
    const worker = activeWorkers.get(player.id);
    if (!worker) {
        player.outputChatBox('!{#ff9800}Вы не работаете.');
        return;
    }
    
    // Возвращаем залог
    if (worker.deposit > 0 && !worker.isOwnVehicle) {
        player.cash = (player.cash || 0) + worker.deposit;
        await db.query('UPDATE characters SET money = ? WHERE id = ?', [player.cash, player.characterId]);
        player.call('client:updateHUD', [JSON.stringify({ cash: player.cash })]);
        player.outputChatBox(`!{#4caf50}[Работа] Залог возвращён: $${worker.deposit}`);
    }
    
    // Удаляем транспорт если арендованный
    if (worker.vehicle && mp.vehicles.exists(worker.vehicle) && !worker.isOwnVehicle) {
        worker.vehicle.destroy();
    }
    
    // Отменяем активный контракт
    if (worker.contract?.dbId) {
        await db.query(
            'UPDATE delivery_contracts SET status = "cancelled" WHERE id = ?',
            [worker.contract.dbId]
        );
    }
    
    activeWorkers.delete(player.id);
    
    player.call('client:clearDeliveryWaypoint');
    player.outputChatBox(`!{#4caf50}[Работа] Смена завершена. Доставок: ${worker.deliveriesCount}`);
});

// ===== КОМАНДЫ =====
mp.events.addCommand('stopwork', (player) => {
    mp.events.call('jobs:stopWork', player);
});

mp.events.addCommand('tablet', (player) => {
    mp.events.call('tablet:open', player, 'main');
});

// ===== ОЧИСТКА ПРИ ВЫХОДЕ =====
mp.events.add('playerQuit', (player) => {
    const worker = activeWorkers.get(player.id);
    if (worker?.vehicle && mp.vehicles.exists(worker.vehicle) && !worker.isOwnVehicle) {
        worker.vehicle.destroy();
    }
    activeWorkers.delete(player.id);
});

// ===== ЭКСПОРТ =====
global.jobSystem = {
    getPlayerJobData,
    getAllPlayerJobs,
    isPlayerWorking: (playerId) => activeWorkers.has(playerId),
    getActiveWorker: (playerId) => activeWorkers.get(playerId)
};

console.log('[Jobs] ✅ Система работ загружена');