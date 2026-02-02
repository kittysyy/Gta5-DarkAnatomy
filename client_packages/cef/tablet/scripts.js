let tabletData = null;
let currentScreen = 'main';

function loadTabletData(dataJson) {
    try {
        if (typeof dataJson === 'string' && dataJson !== 'main') {
            tabletData = JSON.parse(dataJson);
        }
        
        updateTime();
        setInterval(updateTime, 1000);
        
        // Открываем нужную вкладку
        if (tabletData?.tab) {
            openApp(tabletData.tab);
        }
        
        renderDeliveries();
        
    } catch (err) {
        console.error('Ошибка загрузки:', err);
    }
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
}

function openApp(appName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const screen = document.getElementById(appName + 'Screen');
    if (screen) {
        screen.classList.add('active');
        currentScreen = appName;
    }
    
    if (appName === 'deliveries') {
        renderDeliveries();
    }
}

function goHome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('mainScreen').classList.add('active');
    currentScreen = 'main';
}

function renderDeliveries() {
    const statusEl = document.getElementById('deliveryStatus');
    const contractsSection = document.getElementById('contractsSection');
    const currentContractEl = document.getElementById('currentContract');
    
    if (!tabletData?.isWorking) {
        statusEl.innerHTML = `
            <p class="not-working">
                <i class="fas fa-info-circle"></i> Вы не работаете курьером
            </p>
            <p style="color: #888; font-size: 0.85em; margin-top: 10px;">
                Обратитесь к менеджеру курьерской службы возле почты
            </p>
        `;
        contractsSection.style.display = 'none';
        currentContractEl.style.display = 'none';
        return;
    }
    
    // Работаем
    statusEl.innerHTML = `
        <p class="working">
            <i class="fas fa-check-circle"></i> Вы работаете курьером
        </p>
        <div style="display: flex; justify-content: space-around; margin-top: 15px; color: #aaa; font-size: 0.9em;">
            <span>Уровень: <strong style="color: #ffd700;">${tabletData.jobData?.level || 1}</strong></span>
            <span>Доставок: <strong style="color: #fff;">${tabletData.jobData?.totalCompleted || 0}</strong></span>
        </div>
    `;
    
    // Текущий контракт
    if (tabletData.currentContract) {
        currentContractEl.style.display = 'block';
        contractsSection.style.display = 'none';
        
        const contract = tabletData.currentContract;
        const isPickup = contract.status !== 'delivery';
        
        document.getElementById('contractDetails').innerHTML = `
            <div class="cargo-info">
                <div class="cargo-icon">${contract.cargo?.icon || '📦'}</div>
                <div>
                    <div class="cargo-name">${contract.cargo?.name || 'Груз'}</div>
                    <div class="status">${isPickup ? '⏳ Ожидает погрузки' : '🚚 В пути'}</div>
                </div>
            </div>
            <div class="route-info">
                <div class="route-point ${isPickup ? 'active' : ''}">
                    <i class="fas fa-box"></i>
                    <span>${contract.pickup?.name || 'Погрузка'}</span>
                </div>
                <div class="route-point ${!isPickup ? 'active' : ''}">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${contract.delivery?.name || 'Доставка'}</span>
                </div>
            </div>
            <div class="reward-info">
                <span>Награда:</span>
                <span class="reward">$${contract.reward || 0}</span>
            </div>
        `;
    } else {
        currentContractEl.style.display = 'none';
        contractsSection.style.display = 'block';
        
        renderContracts();
    }
}

function renderContracts() {
    const container = document.getElementById('contractsList');
    container.innerHTML = '';
    
    const contracts = tabletData?.availableContracts || [];
    
    if (contracts.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">Нет доступных контрактов</p>';
        return;
    }
    
    contracts.forEach((contract, index) => {
        const card = document.createElement('div');
        card.className = 'contract-card';
        
        card.innerHTML = `
            <div class="contract-header">
                <div class="contract-cargo">${contract.cargo?.icon || '📦'}</div>
                <div class="contract-type">${contract.cargo?.name || 'Груз'}</div>
            </div>
            <div class="contract-route">
                <div class="from">
                    <i class="fas fa-box"></i>
                    <span>${contract.pickup?.name || 'Погрузка'}</span>
                </div>
                <div class="to">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${contract.delivery?.name || 'Доставка'}</span>
                </div>
            </div>
            <div class="contract-footer">
                <div>
                    <div class="contract-reward">$${contract.reward}</div>
                    <div class="contract-distance">~${contract.distance}м</div>
                </div>
                <button class="accept-btn" onclick="acceptContract(${index})">Принять</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function acceptContract(index) {
    const contracts = tabletData?.availableContracts || [];
    const contract = contracts[index];
    
    if (!contract) return;
    
    if (typeof mp !== 'undefined') {
        mp.trigger('cef:acceptContract', JSON.stringify(contract));
    }
}

function closeTablet() {
    if (typeof mp !== 'undefined') {
        mp.trigger('cef:closeTablet');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (currentScreen !== 'main') {
            goHome();
        } else {
            closeTablet();
        }
    }
});

console.log('[Tablet] ✅ Script loaded');