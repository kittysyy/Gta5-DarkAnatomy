// ===== ЗАЩИТА NPC ОТ УРОНА =====

// Массив ID серверных NPC которых нужно защищать
const protectedNPCs = new Set();

// Регистрация NPC для защиты
function registerProtectedNPC(npcId) {
    protectedNPCs.add(npcId);
}

function unregisterProtectedNPC(npcId) {
    protectedNPCs.delete(npcId);
}

function isNPCProtected(npcId) {
    return protectedNPCs.has(npcId);
}

// Экспорт для использования в других модулях
global.npcProtection = {
    register: registerProtectedNPC,
    unregister: unregisterProtectedNPC,
    isProtected: isNPCProtected,
    getAll: () => Array.from(protectedNPCs)
};

console.log('[NPC Protection] ✅ Система защиты NPC загружена');