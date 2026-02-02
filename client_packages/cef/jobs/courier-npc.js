let npcData = null;

function loadNPCData(dataJson) {
    try {
        npcData = JSON.parse(dataJson);
        renderUI();
    } catch (err) {
        console.error('Ошибка:', err);
    }
}

function renderUI() {
    if (!npcData) return;
    
    document.getElementById('rankName').textContent = npcData.rank || 'Стажёр';
    document.getElementById('level').textContent = npcData.level || 1;
    document.getElementById('deliveries').textContent = npcData.totalDeliveries || 0;
    document.getElementById('balance').textContent = (npcData.playerCash || 0).toLocaleString();
    
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';
    
    if (npcData.vehicles) {
        npcData.vehicles.forEach(v => {
            const totalCost = v.price + v.deposit;
            const canAfford = npcData.playerCash >= totalCost;
            
            const card = document.createElement('div');
            card.className = 'vehicle-card' + (canAfford ? '' : ' disabled');
            
            card.innerHTML = `
                <div class="vehicle-icon">${v.icon}</div>
                <div class="vehicle-info">
                    <h4>${v.name}</h4>
                    <div class="price">Аренда: $${v.price}</div>
                    <div class="deposit">Залог: $${v.deposit} (возвращается)</div>
                </div>
                <button class="rent-btn" onclick="rentVehicle('${v.model}')" ${canAfford ? '' : 'disabled'}>
                    $${totalCost}
                </button>
            `;
            
            container.appendChild(card);
        });
    }
}

function rentVehicle(model) {
    mp.trigger('cef:rentVehicle', model);
}

function useOwnVehicle() {
    mp.trigger('cef:useOwnVehicle');
}

function closeMenu() {
    mp.trigger('cef:closeCourierNPC');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
});