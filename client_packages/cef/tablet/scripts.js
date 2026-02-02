let tabletData = null;

function loadTabletData(dataJson) {
    try {
        if (typeof dataJson === 'string' && dataJson.length > 2) {
            tabletData = JSON.parse(dataJson);
        } else {
            tabletData = {};
        }
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Скрываем/показываем иконку доставок
        const deliveryApp = document.getElementById('deliveryApp');
        if (deliveryApp) {
            deliveryApp.style.display = tabletData?.isWorking ? 'flex' : 'none';
        }
        
        // Открываем нужную вкладку
        if (tabletData?.tab) {
            openApp(tabletData.tab);
        }
        
        renderDeliveries();
        
    } catch (err) {
        console.error('[Tablet] Ошибка:', err);
    }
}

function updateDateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
    document.getElementById('currentDate').textContent = `${days[now.getDay()]}, ${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]}`;
}

function openApp(appName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const screen = document.getElementById(appName + 'Screen');
    if (screen) {
        screen.classList.add('active');
    }
    
    if (appName === 'deliveries') {
        renderDeliveries();
    }
}

function goHome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('homeScreen').classList.add('active');
}

function renderDeliveries() {
    const statusEl = document.getElementById('deliveryStatus');
    const contractsEl = document.getElementById('contractsSection');
    
    if (!tabletData?.isWorking) {
        statusEl.innerHTML = `
            <div class="not-working">
                <p>😴 Вы не работаете курьером</p>
                <p style="margin-top:10px;font-size:13px;">Обратитесь к NPC возле почты чтобы на��ать</p>
            </div>
        `;
        contractsEl.innerHTML = '';
        return;
    }
    
    statusEl.innerHTML = `
        <div class="working">
            <i class="fas fa-check-circle"></i>
            Вы на смене
        </div>
        <div style="margin-top:15px;display:flex;gap:30px;color:#8e8e93;font-size:13px;">
            <span>Уровень: <strong style="color:#fff">${tabletData.jobData?.level || 1}</strong></span>
            <span>Доставок: <strong style="color:#fff">${tabletData.jobData?.totalCompleted || 0}</strong></span>
        </div>
    `;
    
    // Текущий контракт
    if (tabletData.currentContract) {
        const c = tabletData.currentContract;
        contractsEl.innerHTML = `
            <h3>📋 Текущий контракт</h3>
            <div class="contract-card" style="border-color: #30d158;">
                <div class="contract-cargo">
                    <span class="icon">${c.cargo?.icon || '📦'}</span>
                    <span class="name">${c.cargo?.name || 'Груз'}</span>
                </div>
                <div class="contract-route">
                    <i class="fas fa-route"></i>
                    ${c.pickup?.name} → ${c.delivery?.name}
                </div>
                <div class="contract-footer">
                    <span class="contract-reward">$${c.reward}</span>
                    <span style="color:#ff9f0a;">${c.status === 'delivery' ? '🚚 В пути' : '📦 Забрать груз'}</span>
                </div>
            </div>
        `;
        return;
    }
    
    // Доступные контракты
    const contracts = tabletData.availableContracts || [];
    
    if (contracts.length === 0) {
        contractsEl.innerHTML = '<p style="color:#8e8e93;text-align:center;">Нет доступных контрактов</p>';
        return;
    }
    
    contractsEl.innerHTML = `
        <h3>📋 Доступные контракты</h3>
        ${contracts.map((c, i) => `
            <div class="contract-card" onclick="acceptContract(${i})">
                <div class="contract-cargo">
                    <span class="icon">${c.cargo?.icon || '📦'}</span>
                    <span class="name">${c.cargo?.name || 'Груз'}</span>
                </div>
                <div class="contract-route">
                    <i class="fas fa-route"></i>
                    ${c.pickup?.name} → ${c.delivery?.name}
                </div>
                <div class="contract-footer">
                    <span class="contract-reward">$${c.reward}</span>
                    <span class="contract-exp">+${c.exp || 15} EXP</span>
                </div>
            </div>
        `).join('')}
    `;
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
        const homeScreen = document.getElementById('homeScreen');
        if (!homeScreen.classList.contains('active')) {
            goHome();
        } else {
            closeTablet();
        }
    }
});

console.log('[Tablet] ✅ Script loaded');