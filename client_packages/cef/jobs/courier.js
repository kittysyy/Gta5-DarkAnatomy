let courierData = null;

function loadCourierData(dataJson) {
    try {
        courierData = JSON.parse(dataJson);
        updateUI();
    } catch (err) {
        console.error('Ошибка:', err);
    }
}

function updateUI() {
    if (!courierData) return;
    
    document.getElementById('rank').textContent = courierData.rank;
    document.getElementById('level').textContent = courierData.level;
    document.getElementById('expProgress').style.width = `${Math.min(100, (courierData.experience / (courierData.experience + courierData.expToNext)) * 100)}%`;
    document.getElementById('expToNext').textContent = courierData.expToNext;
    document.getElementById('basePay').textContent = `$${courierData.basePay}`;
    document.getElementById('tipBonus').textContent = `до $${courierData.tipBonus}`;
    document.getElementById('totalDeliveries').textContent = courierData.totalDeliveries;
    document.getElementById('totalEarned').textContent = `$${courierData.totalEarned.toLocaleString()}`;
    
    if (courierData.isWorking) {
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'block';
    } else {
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('stopBtn').style.display = 'none';
    }
}

function startWork() {
    mp.trigger('cef:startCourier');
}

function stopWork() {
    mp.trigger('cef:stopWork');
}

function closeMenu() {
    mp.trigger('cef:closeCourierMenu');
}