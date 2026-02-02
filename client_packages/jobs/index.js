// ===== СИСТЕМА РАБОТ - КЛИЕНТ =====

let tabletBrowser = null;
let courierNPCBrowser = null;
let isTabletOpen = false;
let isNPCMenuOpen = false;

let currentWaypoint = null;
let waypointBlip = null;
let waypointType = null; // 'pickup' или 'delivery'

// ===== БЛИП NPC =====
mp.events.add('client:createJobBlip', (blipJson) => {
    try {
        const data = JSON.parse(blipJson);
        
        const blip = mp.blips.new(data.sprite, new mp.Vector3(data.x, data.y, data.z), {
            name: data.name,
            color: data.color,
            scale: 0.9,
            shortRange: true
        });
        
        console.log(`[Jobs] Блип создан: ${data.name}`);
    } catch (err) {
        console.error('[Jobs] Ошибка создания блипа:', err);
    }
});

// ===== ОТКРЫТИЕ МЕНЮ NPC КУРЬЕРА =====
mp.events.add('client:openCourierNPC', (dataJson) => {
    if (isNPCMenuOpen) return;
    
    courierNPCBrowser = mp.browsers.new('package://cef/jobs/courier-npc.html');
    
    setTimeout(() => {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);
        mp.players.local.freezePosition(true);
        
        if (courierNPCBrowser) {
            const safeJson = dataJson.replace(/'/g, "\\'");
            courierNPCBrowser.execute(`loadNPCData('${safeJson}')`);
        }
    }, 300);
    
    isNPCMenuOpen = true;
});

mp.events.add('client:closeCourierNPC', () => {
    if (courierNPCBrowser) {
        courierNPCBrowser.destroy();
        courierNPCBrowser = null;
    }
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    mp.players.local.freezePosition(false);
    isNPCMenuOpen = false;
});

mp.events.add('cef:closeCourierNPC', () => {
    mp.events.call('client:closeCourierNPC');
});

mp.events.add('cef:rentVehicle', (model) => {
    mp.events.callRemote('jobs:startCourierWithVehicle', model);
});

mp.events.add('cef:useOwnVehicle', () => {
    mp.events.callRemote('jobs:startCourierOwnVehicle');
});

// ===== ПЛАНШЕТ =====
mp.keys.bind(0x28, true, () => { // Стрелка вниз (Arrow Down)
    if (isTabletOpen) {
        closeTablet();
    } else {
        mp.events.callRemote('tablet:open', 'main');
    }
});

mp.events.add('client:openTablet', (dataJson) => {
    if (isTabletOpen) return;
    
    tabletBrowser = mp.browsers.new('package://cef/tablet/index.html');
    
    setTimeout(() => {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);
        
        if (tabletBrowser) {
            const safeJson = typeof dataJson === 'string' ? dataJson.replace(/'/g, "\\'") : 'main';
            tabletBrowser.execute(`loadTabletData('${safeJson}')`);
        }
    }, 300);
    
    isTabletOpen = true;
});

function closeTablet() {
    if (tabletBrowser) {
        tabletBrowser.destroy();
        tabletBrowser = null;
    }
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    isTabletOpen = false;
}

mp.events.add('client:closeTablet', closeTablet);
mp.events.add('cef:closeTablet', closeTablet);

mp.events.add('cef:acceptContract', (contractJson) => {
    mp.events.callRemote('jobs:acceptContract', contractJson);
});

// ===== ТОЧКИ ДОСТАВКИ =====
mp.events.add('client:setDeliveryWaypoint', (pointJson) => {
    try {
        const point = JSON.parse(pointJson);
        currentWaypoint = point;
        waypointType = point.type;
        
        // Удаляем старый блип
        if (waypointBlip) {
            waypointBlip.destroy();
        }
        
        // Создаём новый
        const sprite = point.type === 'pickup' ? 478 : 501;
        const color = point.type === 'pickup' ? 5 : 2;
        
        waypointBlip = mp.blips.new(sprite, new mp.Vector3(point.x, point.y, point.z), {
            name: point.name,
            color: color,
            scale: 1.0,
            shortRange: false
        });
        
        // Ставим метку на карте
        mp.game.ui.setNewWaypoint(point.x, point.y);
        
        const typeText = point.type === 'pickup' ? '📦 ПОГРУЗКА' : '📍 ДОСТАВКА';
        mp.game.graphics.notify(`~y~${typeText}~w~\n${point.name}`);
        
    } catch (err) {
        console.error('[Jobs] Ошибка установки точки:', err);
    }
});

mp.events.add('client:clearDeliveryWaypoint', () => {
    currentWaypoint = null;
    waypointType = null;
    
    if (waypointBlip) {
        waypointBlip.destroy();
        waypointBlip = null;
    }
});

// ===== ОТРИСОВКА МАРКЕРА =====
mp.events.add('render', () => {
    if (!currentWaypoint) return;
    
    const player = mp.players.local;
    const pos = new mp.Vector3(currentWaypoint.x, currentWaypoint.y, currentWaypoint.z);
    const dist = player.position.subtract(pos).length();
    
    // Рисуем маркер
    const color = waypointType === 'pickup' ? [255, 200, 0] : [0, 255, 100];
    
    mp.game.graphics.drawMarker(
        1,
        pos.x, pos.y, pos.z - 1,
        0, 0, 0,
        0, 0, 0,
        3.0, 3.0, 2.0,
        color[0], color[1], color[2], 150,
        false, false, 2,
        false, null, null, false
    );
    
    // Текст над маркером
    if (dist < 50) {
        const icon = waypointType === 'pickup' ? '📦' : '📍';
        const text = waypointType === 'pickup' ? 'ПОГРУЗКА' : 'ДОСТАВКА';
        
        mp.game.graphics.drawText(`${icon} ${text}`, [pos.x, pos.y, pos.z + 1.5], {
            font: 4,
            color: [255, 255, 255, 255],
            scale: [0.5, 0.5],
            outline: true,
            centre: true
        });
        
        mp.game.graphics.drawText(currentWaypoint.name, [pos.x, pos.y, pos.z + 1.0], {
            font: 4,
            color: [200, 200, 200, 255],
            scale: [0.35, 0.35],
            outline: true,
            centre: true
        });
        
        if (dist < 5) {
            const action = waypointType === 'pickup' ? 'погрузки' : 'выгрузки';
            mp.game.graphics.drawText(`Нажмите ~g~E~w~ для ${action}`, [0.5, 0.85], {
                font: 4,
                color: [255, 255, 255, 200],
                scale: [0.5, 0.5],
                outline: true,
                centre: true
            });
        }
    }
});

// ===== КНОПКА E =====
mp.keys.bind(0x45, false, () => {
    if (!currentWaypoint) return;
    if (mp.gui.cursor.visible) return;
    
    const player = mp.players.local;
    const pos = new mp.Vector3(currentWaypoint.x, currentWaypoint.y, currentWaypoint.z);
    const dist = player.position.subtract(pos).length();
    
    if (dist < 5) {
        if (waypointType === 'pickup') {
            mp.events.callRemote('jobs:pickup');
        } else if (waypointType === 'delivery') {
            mp.events.callRemote('jobs:deliver');
        }
    }
});

// ===== УРОВЕНЬ ПОВЫШЕН =====
mp.events.add('client:levelUp', (level, rankName) => {
    mp.game.graphics.notify(`~g~🎉 УРОВЕНЬ ${level}!~w~\n${rankName}`);
    // Можно добавить звук/эффект
});

console.log('[Jobs Client] ✅ Загружено');