// ===== ТРЕКЕР КВЕСТОВ НА HUD =====

let currentQuest = null;
let questBlip = null;
let questMarker = null;
let trackerVisible = true;

// ===== УСТАНОВКА МАРКЕРА =====
mp.events.add('quest:setMarker', (markerDataJson) => {
    try {
        const data = JSON.parse(markerDataJson);
        
        // Удаляем старый маркер
        removeMarker();
        
        // Создаём блип на карте
        questBlip = mp.blips.new(data.blipSprite || 1, new mp.Vector3(data.x, data.y, data.z), {
            name: 'Цель квеста',
            color: data.blipColor || 5,
            shortRange: false,
            scale: 1.0
        });
        
        console.log(`[Quest Tracker] Маркер установлен: ${data.x}, ${data.y}, ${data.z}`);
    } catch (error) {
        console.error('[Quest Tracker] Error setting marker:', error);
    }
});

// ===== УДАЛЕНИЕ МАРКЕРА =====
mp.events.add('quest:removeMarker', () => {
    removeMarker();
});

function removeMarker() {
    if (questBlip) {
        questBlip.destroy();
        questBlip = null;
    }
}

// ===== ОБНОВЛЕНИЕ ТЕКУЩЕГО КВЕСТА =====
mp.events.add('quest:start', (questDataJson) => {
    try {
        currentQuest = JSON.parse(questDataJson);
        console.log(`[Quest Tracker] Квест начат: ${currentQuest.title}`);
        
        // Показываем уведомление
        mp.game.graphics.notify(`~y~Новый квест:~s~ ${currentQuest.title}`);
    } catch (error) {
        console.error('[Quest Tracker] Error starting quest:', error);
    }
});

mp.events.add('quest:update', (questDataJson) => {
    try {
        const data = JSON.parse(questDataJson);
        if (currentQuest && currentQuest.questId === data.questId) {
            currentQuest.step = data.step;
            currentQuest.objective = data.objective;
        }
        
        mp.game.graphics.notify(`~b~Квест обновлён:~s~ ${data.objective || 'Следующий шаг'}`);
    } catch (error) {
        console.error('[Quest Tracker] Error updating quest:', error);
    }
});

mp.events.add('quest:progress', (progressDataJson) => {
    try {
        const data = JSON.parse(progressDataJson);
        mp.game.graphics.notify(`~b~Прогресс:~s~ ${data.current}/${data.required}`);
    } catch (error) {
        console.error('[Quest Tracker] Error showing progress:', error);
    }
});

mp.events.add('quest:complete', (questDataJson) => {
    try {
        const data = JSON.parse(questDataJson);
        currentQuest = null;
        removeMarker();
        
        // Показываем уведомление о завершении
        mp.game.graphics.notify(`~g~Квест выполнен:~s~ ${data.title}`);
        if (data.rewardText) {
            mp.game.graphics.notify(`~y~Награда:~s~ ${data.rewardText}`);
        }
    } catch (error) {
        console.error('[Quest Tracker] Error completing quest:', error);
    }
});

// ===== ОТРИСОВКА ТРЕКЕРА НА ЭКРАНЕ =====
mp.events.add('render', () => {
    if (!trackerVisible || !currentQuest) return;
    
    // Позиция - правый верхний угол (сдвинуто правее)
    const x = 0.88;  // Было 0.85
    const y = 0.12;
    
    // Без фона - просто текст с тенью
    
    // Заголовок квеста
    mp.game.graphics.drawText(currentQuest.title || 'Квест', [x, y - 0.02], {
        font: 4,
        color: [255, 193, 7, 255],
        scale: [0.38, 0.38],
        outline: true,
        centre: true
    });
    
    // Текущая цель
    const objective = currentQuest.objectives?.[currentQuest.step]?.description || currentQuest.objective || 'Выполните задание';
    mp.game.graphics.drawText(objective, [x, y + 0.012], {
        font: 4,
        color: [255, 255, 255, 220],
        scale: [0.30, 0.30],
        outline: true,
        centre: true
    });
    
    // Прогресс
    const stepText = `Шаг ${(currentQuest.step || 0) + 1}/${currentQuest.steps || 1}`;
    mp.game.graphics.drawText(stepText, [x, y + 0.038], {
        font: 4,
        color: [180, 180, 180, 200],
        scale: [0.25, 0.25],
        outline: true,
        centre: true
    });
});

// ===== ПЕРЕКЛЮЧЕНИЕ ВИДИМОСТИ ТРЕКЕРА =====
mp.keys.bind(0x4A, false, () => { // J
    trackerVisible = !trackerVisible;
    mp.game.graphics.notify(trackerVisible ? '~g~Трекер квестов включён' : '~r~Трекер квестов выключен');
});

// ===== ЗАГРУЗКА КВЕСТОВ ПРИ ВХОДЕ =====
mp.events.add('quest:loadQuests', (questsJson) => {
    try {
        const quests = JSON.parse(questsJson);
        if (quests.length > 0) {
            currentQuest = quests[0]; // Берём первый активный квест
            mp.game.graphics.notify(`~b~У вас ${quests.length} активных квестов`);
            
            // Запрашиваем маркер
            mp.events.callRemote('quest:requestMarker');
        }
    } catch (error) {
        console.error('[Quest Tracker] Error loading quests:', error);
    }
});

// Отслеживание квеста из меню
mp.events.add('quest:track', (questId) => {
    mp.events.callRemote('quest:trackQuest', questId);
});

// Отключение отслеживания
mp.events.add('quest:untrack', () => {
    currentQuest = null;
    removeMarker();
    mp.game.graphics.notify('~o~Отслеживание квеста отключено');
});

// Обновление данных отслеживаемого квеста
mp.events.add('quest:trackUpdate', (questDataJson) => {
    try {
        const data = JSON.parse(questDataJson);
        currentQuest = data;
        
        // Устанавливаем маркер
        if (data.marker) {
            removeMarker();
            questBlip = mp.blips.new(data.marker.blipSprite || 1, new mp.Vector3(data.marker.x, data.marker.y, data.marker.z), {
                name: data.title || 'Цель квеста',
                color: data.marker.blipColor || 5,
                shortRange: false,
                scale: 1.0
            });
        }
        
        mp.game.graphics.notify(`~y~Отслеживается:~s~ ${data.title}`);
    } catch (error) {
        console.error('[Quest Tracker] Error updating tracked quest:', error);
    }
});

// Установка маршрута из меню
mp.events.add('quest:setWaypoint', (questId) => {
    mp.events.callRemote('quest:setWaypointToQuest', questId);
});

// Получение координат маршрута от сервера
mp.events.add('quest:setWaypoint', (x, y) => {
    mp.game.ui.setNewWaypoint(x, y);
    mp.game.graphics.notify('~g~Маршрут проложен!');
});

// ===== ПРОВЕРКА ДОСТИЖЕНИЯ ЦЕЛИ =====
let checkpointCheck = null;

mp.events.add('quest:setMarker', (markerDataJson) => {
    try {
        const data = JSON.parse(markerDataJson);
        
        // Удаляем старый маркер
        removeMarker();
        
        // Соз��аём блип на карте
        questBlip = mp.blips.new(data.blipSprite || 1, new mp.Vector3(data.x, data.y, data.z), {
            name: 'Цель квеста',
            color: data.blipColor || 5,
            shortRange: false,
            scale: 1.0
        });
        
        // Сохраняем позицию для проверки
        const targetPos = new mp.Vector3(data.x, data.y, data.z);
        const radius = data.radius || 3.0;
        
        // Запускаем проверку достижения цели
        if (checkpointCheck) {
            clearInterval(checkpointCheck);
        }
        
        checkpointCheck = setInterval(() => {
            const player = mp.players.local;
            if (!player) return;
            
            const distance = mp.game.system.vdist(
                player.position.x, player.position.y, player.position.z,
                targetPos.x, targetPos.y, targetPos.z
            );
            
            if (distance < radius) {
                // Игрок достиг цели
                mp.events.callRemote('quest:reachedObjective');
                clearInterval(checkpointCheck);
                checkpointCheck = null;
            }
        }, 1000);
        
        console.log(`[Quest Tracker] Маркер установлен: ${data.x}, ${data.y}, ${data.z}`);
    } catch (error) {
        console.error('[Quest Tracker] Error setting marker:', error);
    }
});

mp.events.add('quest:removeMarker', () => {
    removeMarker();
    if (checkpointCheck) {
        clearInterval(checkpointCheck);
        checkpointCheck = null;
    }
});

console.log('[Quest Tracker] ✅ Обработчики меню загружены');
console.log('[Quest Tracker] ✅ Трекер квестов загружен (J - вкл/выкл)');