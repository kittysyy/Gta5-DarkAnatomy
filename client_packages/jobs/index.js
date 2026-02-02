// ===== СИСТЕМА РАБОТ - КЛИЕНТ =====

let tabletBrowser = null;
let courierNPCBrowser = null;
let courierDialogBrowser = null;
let isTabletOpen = false;
let isNPCMenuOpen = false;
let isDialogOpen = false;

let currentWaypoint = null;
let waypointBlip = null;
let waypointType = null;

// ===== СОЗДАНИЕ БЛИПОВ ПРИ ЗАГРУЗКЕ =====
mp.events.add('playerReady', () => {
    setTimeout(() => {
        mp.blips.new(478, new mp.Vector3(105.5, -1568.0, 29.6), {
            name: 'Курьерская служба',
            color: 46,
            scale: 0.9,
            shortRange: true
        });
        console.log('[Jobs] ✅ Блип курьерской службы создан');
    }, 3000);
});

// ===== ДИАЛОГ С NPC =====
mp.events.add('client:openCourierDialog', (dataJson) => {
    if (isDialogOpen || isNPCMenuOpen) return;
    
    console.log('[Jobs] Открытие диалога NPC');
    
    courierDialogBrowser = mp.browsers.new('package://cef/jobs/courier-dialog.html');
    
    setTimeout(() => {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);
        mp.players.local.freezePosition(true);
        
        if (courierDialogBrowser) {
            const safeJson = dataJson.replace(/'/g, "\\'");
            courierDialogBrowser.execute(`loadDialogData('${safeJson}')`);
        }
    }, 300);
    
    isDialogOpen = true;
});

mp.events.add('cef:dialogOption', (option) => {
    console.log('[Jobs] Выбран вариант диалога:', option);
    
    // Закрываем диалог
    if (courierDialogBrowser) {
        courierDialogBrowser.destroy();
        courierDialogBrowser = null;
    }
    isDialogOpen = false;
    
    if (option === 'exit') {
        mp.gui.cursor.visible = false;
        mp.gui.cursor.show(false, false);
        mp.players.local.freezePosition(false);
        return;
    }
    
    // Отправляем на сервер
    mp.events.callRemote('jobs:dialogOption', option);
});

// ===== МЕНЮ NPC КУРЬЕРА (выбор транспорта) =====
mp.events.add('client:openCourierNPC', (dataJson) => {
    if (isNPCMenuOpen) return;
    
    console.log('[Jobs] Открытие меню выбора транспорта');
    
    // Закрываем диалог если открыт
    if (courierDialogBrowser) {
        courierDialogBrowser.destroy();
        courierDialogBrowser = null;
        isDialogOpen = false;
    }
    
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
    console.log('[Jobs] Аренда транспорта:', model);
    mp.events.callRemote('jobs:startCourierWithVehicle', model);
});

mp.events.add('cef:useOwnVehicle', () => {
    console.log('[Jobs] Использование своего транспорта');
    mp.events.callRemote('jobs:startCourierOwnVehicle');
});

// ===== ЗАКРЫТЬ ВСЕ МЕНЮ =====
mp.events.add('client:closeAllJobMenus', () => {
    if (courierDialogBrowser) {
        courierDialogBrowser.destroy();
        courierDialogBrowser = null;
    }
    if (courierNPCBrowser) {
        courierNPCBrowser.destroy();
        courierNPCBrowser = null;
    }
    if (tabletBrowser) {
        tabletBrowser.destroy();
        tabletBrowser = null;
    }
    
    mp.gui.cursor.visible = false;
    mp.gui.cursor.show(false, false);
    mp.players.local.freezePosition(false);
    
    isDialogOpen = false;
    isNPCMenuOpen = false;
    isTabletOpen = false;
});

// ===== ПЛАНШЕТ =====
mp.keys.bind(0x28, true, () => { // Стрелка вниз
    if (mp.gui.cursor.visible) return;
    
    if (isTabletOpen) {
        closeTablet();
    } else {
        console.log('[Jobs] Открытие планшета...');
        mp.events.callRemote('tablet:open', 'main');
    }
});

mp.events.add('client:openTablet', (dataJson) => {
    if (isTabletOpen) return;
    
    console.log('[Jobs] Данные планшета получены');
    
    tabletBrowser = mp.browsers.new('package://cef/tablet/index.html');
    
    setTimeout(() => {
        mp.gui.cursor.visible = true;
        mp.gui.cursor.show(true, true);
        
        if (tabletBrowser) {
            const safeJson = dataJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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
    console.log('[Jobs] Принятие контракта');
    mp.events.callRemote('jobs:acceptContract', contractJson);
});

// ===== ТОЧКИ ДОСТАВКИ =====
mp.events.add('client:setDeliveryWaypoint', (pointJson) => {
    try {
        const point = JSON.parse(pointJson);
        currentWaypoint = point;
        waypointType = point.type;
        
        if (waypointBlip) waypointBlip.destroy();
        
        const sprite = point.type === 'pickup' ? 478 : 501;
        const color = point.type === 'pickup' ? 5 : 2;
        
        waypointBlip = mp.blips.new(sprite, new mp.Vector3(point.x, point.y, point.z), {
            name: point.name,
            color: color,
            scale: 1.0,
            shortRange: false
        });
        
        mp.game.ui.setNewWaypoint(point.x, point.y);
        
        const typeText = point.type === 'pickup' ? '📦 ПОГРУЗКА' : '📍 ДОСТАВКА';
        mp.game.graphics.notify(`~y~${typeText}~w~\n${point.name}`);
        
    } catch (err) {
        console.error('[Jobs] Ошибка:', err);
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
    
    const color = waypointType === 'pickup' ? [255, 200, 0] : [0, 255, 100];
    
    mp.game.graphics.drawMarker(1, pos.x, pos.y, pos.z - 1, 0, 0, 0, 0, 0, 0,
        3.0, 3.0, 2.0, color[0], color[1], color[2], 150, false, false, 2, false, null, null, false);
    
    if (dist < 5 && !mp.gui.cursor.visible) {
        const action = waypointType === 'pickup' ? 'погрузки' : 'выгрузки';
        mp.game.graphics.drawText(`Нажмите ~g~E~w~ для ${action}`, [0.5, 0.85], {
            font: 4, color: [255, 255, 255, 200], scale: [0.5, 0.5], outline: true, centre: true
        });
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

mp.events.add('client:levelUp', (level, rankName) => {
    mp.game.graphics.notify(`~g~🎉 УРОВЕНЬ ${level}!~w~\n${rankName}`);
});

console.log('[Jobs Client] ✅ Загружено');