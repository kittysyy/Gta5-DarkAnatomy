const quests = {
    intro_01: {
        id: 'intro_01',
        title: 'Welcome to Los Santos',
        description: 'Добро пожаловать! Отправляйтесь в магазин и купите воду.',
        giver: 'Quest Giver',  // <-- добавить
        reward: {
            money: 500
        },
        steps: 1
    },
    // Добавь другие квесты с полем giver
};

module.exports = quests;