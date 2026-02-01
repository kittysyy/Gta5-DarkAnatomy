// ===== АРЕНДА ТРАНСПОРТА - CEF =====

let rentalData = null;
let currentCategory = 'all';

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadRentalData(dataJson) {
    console.log('[CEF Rental] Получен JSON:', dataJson);
    
    try {
        if (typeof dataJson === 'string') {
            rentalData = JSON.parse(dataJson);
        } else {
            rentalData = dataJson;
        }
        
        console.log('[CEF Rental] Распарсено:', rentalData);
        
        document.getElementById('pointName').textContent = rentalData.pointName || 'Аренда транспорта';
        document.getElementById('playerCash').textContent = formatNumber(rentalData.playerCash || 0);
        document.getElementById('playerBank').textContent = formatNumber(rentalData.playerBank || 0);
        
        if (rentalData.hasRental && rentalData.currentRental) {
            document.getElementById('currentRental').style.display = 'block';
            document.getElementById('currentVehicleName').textContent = rentalData.currentRental.name;
            document.getElementById('currentDeposit').textContent = formatNumber(rentalData.currentRental.deposit);
        } else {
            document.getElementById('currentRental').style.display = 'none';
        }
        
        renderVehicles();
        setupCategories();
        
    } catch (err) {
        console.error('[CEF Rental] Ошибка:', err);
    }
}

// ===== ОТРИСОВКА СПИСКА =====
function renderVehicles() {
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';
    
    if (!rentalData || !rentalData.vehicles) {
        container.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">Ошибка загрузки</div>';
        return;
    }
    
    const vehicles = Array.isArray(rentalData.vehicles) ? rentalData.vehicles : [];
    
    vehicles.forEach(vehicle => {
        if (currentCategory !== 'all' && vehicle.category !== currentCategory) return;
        
        const totalCost = vehicle.price + vehicle.deposit;
        const canAffordCash = (rentalData.playerCash || 0) >= totalCost;
        const canAffordBank = (rentalData.playerBank || 0) >= totalCost;
        const hasRental = rentalData.hasRental;
        
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <div class="vehicle-icon">${vehicle.icon || '🚗'}</div>
            <div class="vehicle-info">
                <div class="vehicle-name">${vehicle.name}</div>
                <div class="vehicle-price">
                    Аренда: $${formatNumber(vehicle.price)}
                    <span>Залог: $${formatNumber(vehicle.deposit)}</span>
                </div>
            </div>
            <div class="vehicle-actions">
                <button class="rent-btn cash" onclick="rentVehicle('${vehicle.model}', 'cash')" 
                    ${(!canAffordCash || hasRental) ? 'disabled' : ''}>
                    💵 $${formatNumber(totalCost)}
                </button>
                <button class="rent-btn card" onclick="rentVehicle('${vehicle.model}', 'bank')"
                    ${(!canAffordBank || hasRental) ? 'disabled' : ''}>
                    💳 Карта
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (container.children.length === 0) {
        container.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">Нет транспорта</div>';
    }
}

// ===== КАТЕГОРИИ =====
function setupCategories() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderVehicles();
        };
    });
}

function rentVehicle(model, paymentType) {
    if (rentalData && rentalData.hasRental) {
        showNotification('error', 'У вас уже есть аренда!');
        return;
    }
    mp.trigger('cef:rentVehicle', model, paymentType);
}

function returnVehicle() {
    mp.trigger('cef:returnVehicle');
}

function closeMenu() {
    mp.trigger('cef:closeRentalMenu');
}

function showNotification(type, message) {
    const notif = document.getElementById('notification');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, 3000);
}

function formatNumber(num) {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
});

// ===== СООБЩАЕМ ЧТО CEF ГОТОВ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('[CEF Rental] DOM готов, отправляем сигнал');
    mp.trigger('cef:rentalReady');
});

console.log('[CEF Rental] Script loaded');