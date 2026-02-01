// ===== СИСТЕМА АРЕНДЫ ТРАНСПОРТА - КЛИЕНТ =====

let rentalBrowser = null;
let isRentalMenuOpen = false;
let nearRentalNPC = false;
let pendingRentalData = null;

// ===== ПРОВЕРКА РАССТОЯНИЯ ДО NPC АРЕНДЫ =====
setInterval(() => {
    const player = mp.players.local;
    let foundNPC = false;
    
    mp.peds.forEach(ped => {
        if (!ped || !mp.peds.exists(ped)) return;
        
        const npcType = ped.getVariable('npcType');
        if (npcType !== 'vehicle_rental') return;
        
        const distance = mp.game.system.vdist(
            player.position.x, player.position.y, player.position.z,
            ped.position.x, ped.position.y, ped.position.z
        );
        
        if (distance < 3.0) {
            foundNPC = true;
            if (!nearRentalNPC) {
                nearRentalNPC = true;
                mp.game.graphics.notify('~y~Нажмите ~g~E~y~ для аренды транспорта');
            }
        }
    });
    
    if (!foundNPC && nearRentalNPC) {
        nearRentalNPC = false;
    }
}, 500);

// ===== КНОПКА E =====
mp.keys.bind(0x45, false, () => {
    if (isRentalMenuOpen) return;
    if (nearRentalNPC) {
        mp.events.callRemote('vehicle:rental:interact');
    }
});

// ===== ОТКРЫТИЕ МЕНЮ =====
mp.events.add('client:openRentalMenu', (menuDataJson) => {
    if (isRentalMenuOpen) return;
    
    console.log('[VehicleRental] Открытие меню...');
    
    try {
        pendingRentalData = menuDataJson;
        rentalBrowser = mp.browsers.new('package://cef/vehicle-rental/index.html');
        isRentalMenuOpen = true;
        
        // Ждём загрузки браузера
        setTimeout(() => {
            mp.gui.cursor.visible = true;
            if (typeof mp.gui.cursor.show === 'function') {
                mp.gui.cursor.show(true, true);
            }
            mp.players.local.freezePosition(true);
        }, 200);
        
    } catch (err) {
        console.error('[VehicleRental] Ошибка:', err);
    }
});

// ===== КОГДА CEF ГОТОВ - ОТПРАВЛЯЕМ ДАННЫЕ =====
mp.events.add('cef:rentalReady', () => {
    console.log('[VehicleRental] CEF готов, отправляем данные');
    
    if (rentalBrowser && pendingRentalData) {
        const safeJson = pendingRentalData.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        rentalBrowser.execute(`loadRentalData('${safeJson}')`);
        pendingRentalData = null;
    }
});

// ===== ЗАКРЫТИЕ МЕНЮ =====
function closeRentalMenu() {
    if (!isRentalMenuOpen) return;
    
    if (rentalBrowser) {
        rentalBrowser.destroy();
        rentalBrowser = null;
    }
    
    mp.gui.cursor.visible = false;
    if (typeof mp.gui.cursor.show === 'function') {
        mp.gui.cursor.show(false, false);
    }
    
    mp.players.local.freezePosition(false);
    isRentalMenuOpen = false;
    pendingRentalData = null;
}

mp.events.add('client:closeRentalMenu', () => closeRentalMenu());
mp.events.add('cef:closeRentalMenu', () => closeRentalMenu());

mp.keys.bind(0x1B, true, () => {
    if (isRentalMenuOpen) closeRentalMenu();
});

// ===== АРЕНДА =====
mp.events.add('cef:rentVehicle', (model, paymentType) => {
    mp.events.callRemote('rental:rent', model, paymentType);
});

// ===== ВОЗВРАТ =====
mp.events.add('cef:returnVehicle', () => {
    mp.events.callRemote('rental:return');
});

// ===== УВЕДОМЛЕНИЯ =====
mp.events.add('client:rentalNotify', (type, message) => {
    if (rentalBrowser) {
        const safeMsg = message.replace(/'/g, "\\'");
        rentalBrowser.execute(`showNotification('${type}', '${safeMsg}')`);
    }
    
    const prefix = type === 'success' ? '~g~' : type === 'error' ? '~r~' : '~y~';
    mp.game.graphics.notify(`${prefix}${message}`);
});

console.log('[VehicleRental Client] ✅ Загружено');