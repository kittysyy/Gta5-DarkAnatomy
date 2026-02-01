// ===== СИСТЕМА АРЕНДЫ ТРАНСПОРТА - КЛИЕНТ =====

let rentalBrowser = null;
let isRentalMenuOpen = false;
let nearRentalNPC = false;

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

// ===== КНОПКА E ДЛЯ ВЗАИМОДЕЙСТВИЯ =====
mp.keys.bind(0x45, false, () => { // E
    if (isRentalMenuOpen) return;
    
    if (nearRentalNPC) {
        mp.events.callRemote('vehicle:rental:interact');
    }
});

// ===== ОТКРЫТИЕ МЕНЮ =====
mp.events.add('client:openRentalMenu', (menuDataJson) => {
    if (isRentalMenuOpen) return;
    
    try {
        rentalBrowser = mp.browsers.new('package://cef/vehicle-rental/index.html');
        
        setTimeout(() => {
            mp.gui.cursor.visible = true;
            if (typeof mp.gui.cursor.show === 'function') {
                mp.gui.cursor.show(true, true);
            }
            
            mp.players.local.freezePosition(true);
            
            if (rentalBrowser) {
                rentalBrowser.execute(`loadRentalData('${menuDataJson.replace(/'/g, "\\'")}')`);
            }
        }, 300);
        
        isRentalMenuOpen = true;
        
    } catch (err) {
        console.error('[VehicleRental] Ошибка:', err);
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
}

mp.events.add('client:closeRentalMenu', () => closeRentalMenu());
mp.events.add('cef:closeRentalMenu', () => closeRentalMenu());

// ESC для закрытия
mp.keys.bind(0x1B, true, () => {
    if (isRentalMenuOpen) {
        closeRentalMenu();
    }
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
        rentalBrowser.execute(`showNotification('${type}', '${message.replace(/'/g, "\\'")}')`);
    }
    
    const prefix = type === 'success' ? '~g~' : type === 'error' ? '~r~' : '~y~';
    mp.game.graphics.notify(`${prefix}${message}`);
});

console.log('[VehicleRental Client] ✅ Загружено');