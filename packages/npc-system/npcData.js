// ===== КОНФИГУРАЦИЯ NPC =====
// Этот файл содержит все данные о NPC для магазинов и квестов

/**
 * Массив конфигураций NPC
 * Каждый NPC имеет:
 * - id: уникальный идентификатор
 * - type: тип NPC ('shop', 'quest')
 * - model: хэш модели NPC (используется mp.game.joaat)
 * - position: координаты спавна {x, y, z, h} где h - направление
 * - name: имя NPC
 * - data: дополнительные данные (например, shopType или questId)
 */
const npcConfigs = [
    // ===== МАГАЗИНЫ =====
    {
        id: 1,
        type: 'shop',
        model: 'mp_m_shopkeep_01', // Модель продавца магазина
        position: {
            x: -707.5, 
            y: -914.2, 
            z: 19.2, 
            h: 90.0
        },
        name: 'Store Clerk',
        data: {
            shopType: 'grocery',
            shopName: 'Little Seoul 24/7'
        }
    },
    {
        id: 2,
        type: 'shop',
        model: 'mp_m_shopkeep_01', // Модель продавца магазина
        position: {
            x: 25.7, 
            y: -1347.3, 
            z: 29.49, 
            h: 180.0
        },
        name: 'Продавец продуктового магазина',
        data: {
            shopType: 'grocery',
            shopName: 'Продуктовый магазин 24/7'
        }
    },
    {
        id: 3,
        type: 'shop',
        model: 's_m_m_linecook', // Модель повара
        position: {
            x: -47.5,
            y: -1758.9,
            z: 29.42,
            h: 45.0
        },
        name: 'Продавец бургеров',
        data: {
            shopType: 'food',
            shopName: 'Burger Shot'
        }
    },
    
    // ===== КВЕСТ-ГИВЕРЫ =====
    {
        id: 4,
        type: 'quest',
        model: 'a_m_m_business_01', // Бизнесмен
        position: {
            x: -1037.7,
            y: -2738.5,
            z: 20.0,
            h: 180.0
        },
        name: 'Quest Giver',
        data: {
            questId: 'starter_quest',
            questName: 'Starter Quest'
        }
    },
    {
        id: 5,
        type: 'quest',
        model: 'a_m_m_business_01', // Бизнесмен
        position: {
            x: -275.0,
            y: -956.5,
            z: 31.22,
            h: 210.0
        },
        name: 'Квестодатель - Бизнес',
        data: {
            questId: 'business_intro',
            questName: 'Введение в бизнес'
        }
    },
    {
        id: 6,
        type: 'quest',
        model: 'a_m_y_hipster_01', // Хипстер
        position: {
            x: 105.5,
            y: -1280.5,
            z: 29.25,
            h: 120.0
        },
        name: 'Квестодатель - Улицы',
        data: {
            questId: 'street_intro',
            questName: 'Знакомство с районом'
        }
    },
    {
        id: 5,
        type: 'quest',
        model: 'a_f_m_eastsa_02', // Friendly woman
        position: {
            x: 30.0,
            y: -1339.0,
            z: 29.49,
            h: 270.0
        },
        name: 'Welcome Guide',
        data: {
            questId: 'intro_01',
            questName: 'Welcome to Los Santos'
        }
    }
];

module.exports = npcConfigs;
