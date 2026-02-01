// ===== ДАННЫЕ ОДЕЖДЫ ИЗ RAGE MP WIKI =====
// Источник: https://github.com/root-cause/v-besttorso

// Лучший torso для каждого top (мужская модель)
const MALE_BEST_TORSO = {
    0: 0,   // T-shirt
    1: 0,   // T-shirt 2
    2: 2,   // Polo
    3: 0,   // T-shirt 3
    4: 0,   // Suit jacket
    5: 0,   // Business shirt
    6: 11,  // Hoodie
    7: 11,  // Hoodie 2
    8: 5,   // Jacket
    9: 5,   // Jacket 2
    10: 5,  // Jacket 3
    11: 0,  // Shirt
    12: 0,  // Shirt 2
    13: 6,  // Tank top
    14: 14, // Nothing
    15: 15, // Tank top 2
    16: 15, // Tank top 3
    17: 15, // Tank top 4
    18: 5,  // Jacket 4
    19: 5,  // Jacket 5
    20: 5,  // Jacket 6
    21: 5,  // Jacket 7
    22: 0,  // Shirt 3
    23: 4,  // Vest
    24: 5,  // Jacket 8
    25: 4,  // Vest 2
    26: 0,  // Shirt 4
    27: 0,  // Shirt 5
    28: 4,  // Vest 3
    29: 0,  // Shirt 6
    30: 0,  // Shirt 7
    31: 0,  // Button up shirt
    32: 0,  // Shirt 8
    33: 15, // Tank 5
    34: 15, // Tank 6
    35: 15, // Tank 7
    36: 0,  // Shirt 9
    37: 0,  // Shirt 10
    38: 0,  // Shirt 11
    39: 0,  // Shirt 12
    40: 0,  // Shirt 13
    41: 0,  // Shirt 14
    42: 15, // Tank 8
    43: 15, // Tank 9
    44: 15, // Tank 10
    45: 4,  // Vest 4
    46: 4,  // Vest 5
    47: 4,  // Vest 6
    48: 11, // Hoodie 3
    49: 11, // Hoodie 4
    50: 11, // Hoodie 5
    51: 11, // Hoodie 6
    52: 11, // Hoodie 7
    53: 11, // Hoodie 8
    54: 11, // Hoodie 9
    55: 1,  // Jacket 9
    56: 1,  // Jacket 10
    57: 1,  // Jacket 11
    58: 1,  // Jacket 12
    59: 1,  // Jacket 13
    60: 1,  // Jacket 14
    61: 11, // Hoodie 10
    62: 11, // Hoodie 11
    63: 5,  // Jacket 15
    64: 0,  // Flannel shirt
    65: 0,  // Shirt 15
    66: 0,  // Shirt 16
    67: 6,  // Track jacket
    68: 6,  // Track jacket 2
    69: 6,  // Track jacket 3
    70: 0,  // Denim jacket
    71: 0,  // Shirt 17
    72: 0,  // Shirt 18
    73: 0,  // Shirt 19
    74: 6,  // Jacket 16
    75: 6,  // Jacket 17
    76: 0,  // Shirt 20
    77: 0,  // Shirt 21
    78: 4,  // Vest 7
    79: 4,  // Vest 8
    80: 0,  // Shirt 22
    81: 6,  // Jacket 18
    82: 6,  // Jacket 19
    83: 6,  // Jacket 20
    84: 1,  // Suit 2
    85: 1,  // Suit 3
    86: 1,  // Suit 4
    87: 6,  // Track jacket 4
    88: 6,  // Track jacket 5
    89: 6,  // Leather jacket
    90: 6,  // Leather jacket 2
    91: 6,  // Leather jacket 3
    92: 6,  // Leather jacket 4
    93: 6,  // Jacket 21
    94: 1,  // Suit 5
    95: 1,  // Suit 6
    96: 1,  // Suit 7
    97: 4,  // Vest 9
    98: 4,  // Vest 10
    99: 4,  // Vest 11
    100: 1, // Suit 8
    101: 1, // Suit 9
    102: 11, // Hoodie 12
    103: 11, // Hoodie 13
    104: 11, // Hoodie 14
    105: 0, // Shirt 23
    106: 0, // Shirt 24
    107: 0, // Shirt 25
    108: 0, // Shirt 26
    109: 0, // Shirt 27
    110: 0, // Shirt 28
    111: 4, // Vest 12
    112: 4, // Vest 13
    113: 4, // Vest 14
    114: 11, // Hoodie 15
    115: 11, // Hoodie 16
    116: 11, // Hoodie 17
    117: 6, // Jacket 22
    118: 6, // Jacket 23
    119: 6, // Jacket 24
    120: 6, // Jacket 25
    121: 6, // Jacket 26
    122: 4, // Vest 15
    123: 4, // Vest 16
    124: 4, // Vest 17
    125: 4, // Vest 18
    126: 4, // Vest 19
    127: 4, // Vest 20
    128: 4, // Vest 21
    129: 4, // Vest 22
    130: 4, // Vest 23
    131: 4, // Vest 24
    132: 4, // Vest 25
    133: 4, // Vest 26
    134: 0, // Shirt 29
    135: 0, // Shirt 30
    136: 0, // Shirt 31
    137: 0, // Shirt 32
    138: 11, // Hoodie 18 (толстовка)
    139: 11, // Hoodie 19
    140: 11, // Hoodie 20
    141: 11, // Hoodie 21
    142: 11, // Hoodie 22
    143: 6,  // Bomber jacket
    144: 6,  // Jacket 27
    145: 6,  // Jacket 28
    146: 6,  // Jacket 29
    147: 6,  // Jacket 30
    148: 0, // Shirt 33
    149: 0, // Shirt 34
    150: 6, // Jacket 31
    151: 6, // Jacket 32
    152: 6, // Jacket 33
    153: 4, // Vest 27
    154: 4, // Vest 28
    155: 11, // Hoodie 23
    156: 11, // Hoodie 24
    157: 4, // Vest 29
    158: 4, // Vest 30
    159: 14, // Bare chest
    160: 14, // Bare chest 2
    161: 0, // Shirt 35
    162: 0, // Shirt 36
    163: 0, // Shirt 37
    164: 0, // Shirt 38
    165: 0, // Shirt 39
    166: 0, // Shirt 40
    167: 6, // Jacket 34
    168: 6, // Jacket 35
    169: 6, // Jacket 36
    170: 1, // Suit 10
    171: 1, // Suit 11
    172: 1, // Suit 12
    173: 1, // Suit 13
    174: 1, // Suit 14
    175: 1, // Suit 15
    176: 14 // Bare chest 3
};

// Таблица соответс��вия топов и торсов для mp_m_freemode_01
const TORSO_MAP = {
    // Футболки (drawable 0)
    0: { torso: 15, undershirt: 15 },
    // Поло (drawable 2)
    2: { torso: 12, undershirt: 15 },
    // Пиджак (drawable 4)
    4: { torso: 4, undershirt: 15 },
    // Майка (drawable 15)
    15: { torso: 15, undershirt: 15 },
    // Жилетка (drawable 23)
    23: { torso: 11, undershirt: 15 },
    // Рубашка (drawable 31)
    31: { torso: 11, undershirt: 15 },
    // Толстовка (drawable 48)
    48: { torso: 14, undershirt: 15 },
    // Кожаная куртка (drawable 55)
    55: { torso: 1, undershirt: 15 },
    // Джинсовая куртка (drawable 63)
    63: { torso: 5, undershirt: 15 },
    // Фланелевая рубашка (drawable 64)
    64: { torso: 11, undershirt: 15 },
    // Спортивная куртка (drawable 67)
    67: { torso: 5, undershirt: 15 },
    // Бомбер (drawable 117)
    117: { torso: 5, undershirt: 15 },
};

function getBestTorso(topDrawable) {
    const mapping = TORSO_MAP[topDrawable];
    if (mapping) {
        return mapping.torso;
    }
    // По умолчанию - базовый торс
    return 15;
}

module.exports = { getBestTorso, TORSO_MAP };

module.exports = { MALE_BEST_TORSO, getBestTorso };