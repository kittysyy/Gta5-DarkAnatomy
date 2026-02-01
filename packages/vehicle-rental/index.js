// ===== СИСТЕМА АРЕНДЫ ТРАНСПОРТА =====

const { db } = require('../database');

// Конфигурация транспорта для аренды
const RENTAL_VEHICLES = {
    // Мопеды/Мотоциклы
    'faggio': { name: 'Faggio (Мопед)', price: 50, deposit: 100, category: 'moped', icon: '🛵' },
    'faggio2': { name: 'Faggio Sport', price: 75, deposit: 150, category: 'moped', icon: '🛵' },
    
    // Простые авто
    'blista': { name: 'Blista', price: 100, deposit: 300, category: 'economy', icon: '🚗' },
    'dilettante': { name: 'Dilettante', price: 80, deposit: 250, category: 'economy', icon: '🚗' },
    'issi2': { name: 'Issi', price: 90, deposit: 280, category: 'economy', icon: '🚗' },
    'panto': { name: 'Panto', price: 60, deposit: 200, category: 'economy', icon: '🚗' },
    'prairie': { name: 'Prairie', price: 120, deposit: 350, category: 'economy', icon: '🚗' },
    
    // Стандартные авто
    'sultan': { name: 'Sultan', price: 200, deposit: 500, category: 'standard', icon: '🚙' },
    'kuruma': { name: 'Kuruma', price: 250, deposit: 600, category: 'standard', icon: '🚙' }
};

// Точки аренды (NPC) - ВСЕ ВАЖНЫЕ ЛОКАЦИИ
const RENTAL_POINTS = [
    // Аэропорт
    {
        id: 'airport_rental',
        name: 'Аренда - Аэропорт',
        model: 's_m_m_lathandy_01',
        position: { x: -1037.0, y: -2733.0, z: 20.17 },
        heading: 240.0,
        spawnPoint: { x: -1025.0, y: -2728.0, z: 13.3, heading: 60.0 }
    },
    // Центр города (Legion Square)
    {
        id: 'legion_rental',
        name: 'Аренда - Legion Square',
        model: 's_m_m_lathandy_01',
        position: { x: 213.0, y: -935.0, z: 24.14 },
        heading: 140.0,
        spawnPoint: { x: 220.0, y: -940.0, z: 24.0, heading: 70.0 }
    },
    // Больница Pillbox
    {
        id: 'hospital_rental',
        name: 'Аренда - Больница',
        model: 's_m_m_lathandy_01',
        position: { x: 295.0, y: -583.0, z: 43.26 },
        heading: 65.0,
        spawnPoint: { x: 285.0, y: -590.0, z: 43.0, heading: 160.0 }
    },
    // Мэрия
    {
        id: 'cityhall_rental',
        name: 'Аренда - Мэрия',
        model: 's_m_m_lathandy_01',
        position: { x: -535.0, y: -220.0, z: 37.65 },
        heading: 210.0,
        spawnPoint: { x: -545.0, y: -230.0, z: 37.0, heading: 30.0 }
    },
    // Полиция Mission Row
    {
        id: 'police_rental',
        name: 'Аренда - Полиция',
        model: 's_m_m_lathandy_01',
        position: { x: 455.0, y: -1010.0, z: 28.1 },
        heading: 90.0,
        spawnPoint: { x: 448.0, y: -1020.0, z: 28.0, heading: 0.0 }
    },
    // Вокзал
    {
        id: 'station_rental',
        name: 'Аренда - Вокзал',
        model: 's_m_m_lathandy_01',
        position: { x: -550.0, y: -675.0, z: 33.68 },
        heading: 0.0,
        spawnPoint: { x: -560.0, y: -670.0, z: 33.0, heading: 270.0 }
    },
    // Пляж (Веспуччи)
    {
        id: 'beach_rental',
        name: 'Аренда - Пляж',
        model: 's_m_m_lathandy_01',
        position: { x: -1220.0, y: -1510.0, z: 4.36 },
        heading: 125.0,
        spawnPoint: { x: -1230.0, y: -1500.0, z: 4.0, heading: 310.0 }
    },
    // Винвуд
    {
        id: 'vinewood_rental',
        name: 'Аренда - Винвуд',
        model: 's_m_m_lathandy_01',
        position: { x: 290.0, y: 180.0, z: 104.3 },
        heading: 250.0,
        spawnPoint: { x: 280.0, y: 175.0, z: 104.0, heading: 70.0 }
    }
];

// Хранилище
const rentedVehicles = new Map();
const rentalNPCs = new Map();

// ===== СОЗДАНИЕ NPC =====
function createRentalNPCs() {
    RENTAL_POINTS.forEach(point => {
        const npc = mp.peds.new(
            mp.joaat(point.model),
            new mp.Vector3(point.position.x, point.position.y, point.position.z),
            {
                heading: point.heading,
                dynamic: false
            }
        );
        
        npc.setVariable('isServerNPC', true);
        npc.setVariable('npcType', 'vehicle_rental');
        npc.setVariable('rentalPointId', point.id);
        npc.setVariable('npcId', `rental_${point.id}`);
        
        rentalNPCs.set(point.id, { npc, config: point });
        
        console.log(`[VehicleRental] NPC создан: ${point.name}`);
    });
}

setTimeout(createRentalNPCs, 3000);

// ===== ПРОВЕРКА РАССТОЯНИЯ ДО NPC АРЕНДЫ =====
function getNearbyRentalPoint(player) {
    let nearestPoint = null;
    let minDistance = 3.0;
    
    rentalNPCs.forEach((data, pointId) => {
        if (!data.npc || !mp.peds.exists(data.npc)) return;
        
        const distance = Math.sqrt(
            Math.pow(player.position.x - data.config.position.x, 2) +
            Math.pow(player.position.y - data.config.position.y, 2) +
            Math.pow(player.position.z - data.config.position.z, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = pointId;
        }
    });
    
    return nearestPoint;
}

// ===== КОМАНДА ДЛЯ ОТКРЫТИЯ МЕНЮ =====
mp.events.addCommand('rent', (player) => {
    const pointId = getNearbyRentalPoint(player);
    
    if (!pointId) {
        player.outputChatBox('!{#f44336}Вы не рядом с точкой аренды!');
        return;
    }
    
    openRentalMenu(player, pointId);
});

// ===== ВЗАИМОДЕЙСТВИЕ ПО КНОПКЕ E =====
mp.events.add('vehicle:rental:interact', (player) => {
    const pointId = getNearbyRentalPoint(player);
    
    if (pointId) {
        openRentalMenu(player, pointId);
    }
});

// ===== ОТКРЫТИЕ МЕНЮ =====
// ===== ОТКРЫТИЕ МЕНЮ =====
function openRentalMenu(player, pointId) {
    const point = RENTAL_POINTS.find(p => p.id === pointId);
    if (!point) return;
    
    const currentRental = rentedVehicles.get(player.id);
    
    // Преобразуем объект vehicles в массив для CEF
    const vehiclesArray = Object.entries(RENTAL_VEHICLES).map(([model, data]) => ({
        model: model,
        name: data.name,
        price: data.price,
        deposit: data.deposit,
        category: data.category,
        icon: data.icon
    }));
    
    const menuData = {
        pointId: pointId,
        pointName: point.name,
        vehicles: vehiclesArray,
        hasRental: !!currentRental,
        currentRental: currentRental ? {
            model: currentRental.model,
            name: RENTAL_VEHICLES[currentRental.model]?.name || currentRental.model,
            deposit: currentRental.deposit
        } : null,
        playerCash: player.cash || 0,
        playerBank: player.bank || 0
    };
    
    console.log(`[VehicleRental] Открытие меню для ${player.name}, cash: ${player.cash}, bank: ${player.bank}`);
    
    player.call('client:openRentalMenu', [JSON.stringify(menuData)]);
}

// ===== АРЕНДА ТРАНСПОРТА =====
mp.events.add('rental:rent', async (player, model, paymentType) => {
    try {
        const vehicle = RENTAL_VEHICLES[model];
        if (!vehicle) {
            player.call('client:rentalNotify', ['error', 'Транспорт не найден!']);
            return;
        }
        
        if (rentedVehicles.has(player.id)) {
            player.call('client:rentalNotify', ['error', 'У вас уже есть арендованный транспорт!']);
            return;
        }
        
        const totalCost = vehicle.price + vehicle.deposit;
        
        if (paymentType === 'cash') {
            if ((player.cash || 0) < totalCost) {
                player.call('client:rentalNotify', ['error', `Недостаточно наличных! Нужно: $${totalCost}`]);
                return;
            }
            player.cash -= totalCost;
        } else {
            if ((player.bank || 0) < totalCost) {
                player.call('client:rentalNotify', ['error', `Недостаточно на карте! Нужно: $${totalCost}`]);
                return;
            }
            player.bank -= totalCost;
        }
        
        // Находим точку спавна
        let spawnPoint = { x: player.position.x + 5, y: player.position.y + 5, z: player.position.z, heading: 0 };
        
        const pointId = getNearbyRentalPoint(player);
        if (pointId && rentalNPCs.has(pointId)) {
            spawnPoint = rentalNPCs.get(pointId).config.spawnPoint;
        }
        
        // Создаём транспорт
		const veh = mp.vehicles.new(
			mp.joaat(model),
			new mp.Vector3(spawnPoint.x, spawnPoint.y, spawnPoint.z),
			{
				heading: spawnPoint.heading,
				color: [[255, 255, 255], [255, 255, 255]],
				locked: false,
				engine: false
			}
		);

		veh.setVariable('isRental', true);
		veh.setVariable('rentalOwner', player.id);
		veh.setVariable('rentalModel', model);

		rentedVehicles.set(player.id, {
			vehicle: veh,
			model: model,
			deposit: vehicle.deposit,
			rentTime: Date.now()
		});

		// ТЕЛЕПОРТ ИГРОКА В АВТО
		setTimeout(() => {
			if (veh && mp.vehicles.exists(veh)) {
				player.putIntoVehicle(veh, 0); // 0 = водительское место
			}
		}, 500);
        
        if (player.characterId) {
            await db.query(
                'UPDATE characters SET money = ?, bank = ? WHERE id = ?',
                [player.cash, player.bank, player.characterId]
            );
        }
        
        player.call('client:rentalNotify', ['success', `Вы арендовали ${vehicle.name}!`]);
        player.call('client:closeRentalMenu', []);
        player.call('client:updateHUD', [JSON.stringify({ cash: player.cash, bank: player.bank })]);
        
        console.log(`[VehicleRental] ${player.name} арендовал ${model}`);
        
    } catch (err) {
        console.error('[VehicleRental] Ошибка:', err);
        player.call('client:rentalNotify', ['error', 'Ошибка аренды!']);
    }
});

// ===== ВОЗВРАТ ТРАНСПОРТА =====
mp.events.add('rental:return', async (player) => {
    try {
        const rental = rentedVehicles.get(player.id);
        
        if (!rental) {
            player.call('client:rentalNotify', ['error', 'У вас нет арендованного транспорта!']);
            return;
        }
        
        const pointId = getNearbyRentalPoint(player);
        if (!pointId) {
            player.call('client:rentalNotify', ['error', 'Вернитесь к точке аренды!']);
            return;
        }
        
        let depositReturn = rental.deposit;
        
        if (rental.vehicle && mp.vehicles.exists(rental.vehicle)) {
            const health = rental.vehicle.health;
            
            if (health < 1000) {
                const damagePercent = (1000 - health) / 1000;
                const deduction = Math.floor(rental.deposit * damagePercent);
                depositReturn = Math.max(0, rental.deposit - deduction);
                
                if (deduction > 0) {
                    player.call('client:rentalNotify', ['warning', `Вычтено $${deduction} за повреждения`]);
                }
            }
            
            rental.vehicle.destroy();
        } else {
            depositReturn = 0;
            player.call('client:rentalNotify', ['warning', 'Транспорт потерян! Залог не возвращается.']);
        }
        
        player.cash = (player.cash || 0) + depositReturn;
        rentedVehicles.delete(player.id);
        
        if (player.characterId) {
            await db.query('UPDATE characters SET money = ? WHERE id = ?', [player.cash, player.characterId]);
        }
        
        player.call('client:rentalNotify', ['success', `Транспорт возвращён! Залог: $${depositReturn}`]);
        player.call('client:closeRentalMenu', []);
        player.call('client:updateHUD', [JSON.stringify({ cash: player.cash, bank: player.bank })]);
        
    } catch (err) {
        console.error('[VehicleRental] Ошибка:', err);
    }
});

// ===== ОЧИСТКА ПРИ ВЫХОДЕ =====
mp.events.add('playerQuit', (player) => {
    const rental = rentedVehicles.get(player.id);
    if (rental?.vehicle && mp.vehicles.exists(rental.vehicle)) {
        rental.vehicle.destroy();
    }
    rentedVehicles.delete(player.id);
});

console.log(`[VehicleRental] ✅ Загружено! Точек: ${RENTAL_POINTS.length}`);