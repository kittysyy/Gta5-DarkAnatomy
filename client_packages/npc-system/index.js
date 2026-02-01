// ===== КЛИЕНТСКАЯ СИСТЕМА NPC =====
// Спавн NPC и обработка взаимодействия

// Хранилище NPC
let npcData = [];
let spawnedNPCs = [];
let npcLabels = [];

// Флаг блокировки взаимодействия
let isInteracting = false;

// ===== СИНХРОНИЗАЦИЯ NPC С СЕРВЕРА =====
/**
 * Получаем данные о NPC с сервера и создаём их в игре
 */
mp.events.add('npc:sync', (npcDataJson) => {
    try {
        npcData = JSON.parse(npcDataJson);
        console.log(`[NPC System] Получено ${npcData.length} NPC для спавна`);
        
        // Спавним всех NPC
        spawnAllNPCs();
    } catch (error) {
        console.error('[NPC System] Ошибка парсинга данных NPC:', error);
    }
});

// ===== СПАВН ВСЕХ NPC =====
/**
 * Создаёт всех NPC в игровом мире
 */
function spawnAllNPCs() {
    // Очищаем старые NPC если есть
    cleanupNPCs();
    
    npcData.forEach(npc => {
        try {
            // Получаем хэш модели
            const modelHash = mp.game.joaat(npc.model);
            
            // Создаём позицию
            const position = new mp.Vector3(
                npc.position.x,
                npc.position.y,
                npc.position.z
            );
            
            // Создаём Ped
            const ped = mp.peds.new(
                modelHash,
                position,
                npc.position.h, // Направление
                (streamPed) => {
                    // Callback после создания
                    // Делаем NPC неуязвимым и замороженным
                    streamPed.setInvincible(true);
                    streamPed.freezePosition(true);
                    streamPed.setCanBeTargetted(false);
                    streamPed.setCanBeDamaged(false);
                    streamPed.taskSetBlockingOfNonTemporaryEvents(true);
                },
                0 // dimension
            );
            
            // Сохраняем ссылку на NPC с его ID
            ped.npcId = npc.id;
            ped.npcType = npc.type;
            ped.npcName = npc.name;
            spawnedNPCs.push(ped);
            
            // Создаём TextLabel над NPC
            createNPCLabel(npc, position);
            
            console.log(`[NPC System] Создан NPC: ${npc.name} (ID: ${npc.id})`);
        } catch (error) {
            console.error(`[NPC System] Ошибка создания NPC ${npc.id}:`, error);
        }
    });
    
    console.log(`[NPC System] ✅ Создано ${spawnedNPCs.length} NPC`);
}

// ===== СОЗДАНИЕ ТЕКСТОВОЙ МЕТКИ НАД NPC =====
/**
 * Создаёт текстовую метку над головой NPC
 */
function createNPCLabel(npc, position) {
    try {
        // Поднимаем метку на 1 метр над NPC
        const labelPos = new mp.Vector3(
            position.x,
            position.y,
            position.z + 1.0
        );
        
        // Определяем цвет метки в зависимости от типа NPC
        let labelColor = [255, 255, 255, 255]; // Белый по умолчанию
        let labelText = npc.name;
        
        if (npc.type === 'shop') {
            labelColor = [76, 175, 80, 255]; // Зелёный для магазинов
            labelText = `${npc.name}\n[E] Открыть магазин`;
        } else if (npc.type === 'quest') {
            labelColor = [156, 39, 176, 255]; // Фиолетовый для квестов
            labelText = `${npc.name}\n[E] Поговорить`;
        }
        
        // Создаём метку
        const label = mp.labels.new(
            labelText,
            labelPos,
            {
                los: false,
                font: 4,
                drawDistance: 10.0,
                color: labelColor,
                dimension: 0
            }
        );
        
        // Сохраняем метку
        label.npcId = npc.id;
        npcLabels.push(label);
    } catch (error) {
        console.error(`[NPC System] Ошибка создания метки для NPC ${npc.id}:`, error);
    }
}

// ===== ОЧИСТКА NPC =====
/**
 * Удаляет все созданные NPC и метки
 */
function cleanupNPCs() {
    // Удаляем NPC
    spawnedNPCs.forEach(ped => {
        if (ped && mp.peds.exists(ped)) {
            ped.destroy();
        }
    });
    spawnedNPCs = [];
    
    // Удаляем метки
    npcLabels.forEach(label => {
        if (label && mp.labels.exists(label)) {
            label.destroy();
        }
    });
    npcLabels = [];
    
    console.log('[NPC System] Очищены все NPC');
}

// ===== ОБРАБОТКА ВЗАИМОДЕЙСТВИЯ =====
/**
 * Проверяет нажатие клавиши E и взаимодействие с ближайшим NPC
 */
mp.keys.bind(0x45, true, () => { // Клавиша E (код 0x45)
    // Проверяем, не взаимодействуем ли мы уже
    if (isInteracting) return;
    
    // Проверяем, что локальный игрок существует
    const localPlayer = mp.players.local;
    if (!localPlayer) return;
    
    // Ищем ближайший NPC в радиусе 2.0 метра
    const nearestNPC = findNearestNPC(localPlayer.position, 2.0);
    
    if (nearestNPC) {
        // Блокируем повторное взаимодействие на 1 секунду
        isInteracting = true;
        setTimeout(() => {
            isInteracting = false;
        }, 1000);
        
        // Отправляем событие на сервер
        mp.events.callRemote('npc:interact', nearestNPC.npcId);
        console.log(`[NPC System] Взаимодействие с NPC: ${nearestNPC.npcName} (ID: ${nearestNPC.npcId})`);
    }
});

// ===== ПОИСК БЛИЖАЙШЕГО NPC =====
/**
 * Находит ближайший NPC в указанном радиусе
 * @param {Vector3} position - Позиция игрока
 * @param {number} maxDistance - Максимальное расстояние
 * @returns {object|null} - Ближайший NPC или null
 */
function findNearestNPC(position, maxDistance) {
    let nearestNPC = null;
    let nearestDistance = maxDistance;
    
    spawnedNPCs.forEach(ped => {
        if (!ped || !mp.peds.exists(ped)) return;
        
        // Получаем позицию NPC
        const pedPos = ped.position;
        
        // Вычисляем расстояние
        const distance = position.subtract(pedPos).length();
        
        // Проверяем, ближе ли этот NPC
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestNPC = ped;
        }
    });
    
    return nearestNPC;
}

// ===== ОЧИСТКА ПРИ ВЫХОДЕ =====
/**
 * Очищаем NPC при отключении (RageMP автоматически очищает клиентские сущности)
 * Можно использовать событие 'disconnect' если нужна дополнительная очистка
 */
mp.events.add('disconnect', () => {
    cleanupNPCs();
});

console.log('[NPC System] ✅ Клиентская система NPC инициализирована');
