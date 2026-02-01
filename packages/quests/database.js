const { db } = require('../database');

async function initializeDatabase() {
    try {
        // Create character_quests table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS character_quests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                character_id INT NOT NULL,
                quest_id VARCHAR(50) NOT NULL,
                status INT DEFAULT 0 COMMENT '0=active, 1=completed',
                step INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
                INDEX idx_character_quest (character_id, quest_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        
        console.log('[Quests] Database table initialized successfully');
    } catch (error) {
        console.error('[Quests] Error initializing database:', error);
    }
}

module.exports = { initializeDatabase };
