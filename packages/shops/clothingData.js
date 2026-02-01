// ===== СИСТЕМА ТОРСОВ ДЛЯ ОДЕЖДЫ =====
// Данные из: https://github.com/root-cause/v-besttorso

const fs = require('fs');
const path = require('path');

let torsoDataMale = {};

try {
    const malePath = path.join(__dirname, 'besttorso_male.json');
    if (fs.existsSync(malePath)) {
        torsoDataMale = JSON.parse(fs.readFileSync(malePath, 'utf8'));
    }
} catch (err) {
    console.error('[ClothingData] Ошибка загрузки besttorso_male.json:', err);
}

function getBestTorso(topDrawable, topTexture = 0) {
    const drawableKey = String(topDrawable);
    const textureKey = String(topTexture);
    
    if (torsoDataMale[drawableKey] && torsoDataMale[drawableKey][textureKey]) {
        const data = torsoDataMale[drawableKey][textureKey];
        
        if (data.BestTorsoDrawable === -1) {
            return null;
        }
        
        return {
            torsoDrawable: data.BestTorsoDrawable,
            torsoTexture: data.BestTorsoTexture
        };
    }
    
    return null;
}

module.exports = { getBestTorso, torsoDataMale };
