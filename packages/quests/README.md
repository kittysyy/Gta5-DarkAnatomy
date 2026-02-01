# Quest System Documentation

## Overview

The Quest System provides a complete framework for creating and managing quests in the GTA V RP server. It includes database persistence, server-side quest logic, and a client-side UI for quest dialogs.

## Structure

### Server-side (`packages/quests/`)

- **database.js**: Handles database initialization and creates the `character_quests` table
- **definitions.js**: Contains all quest definitions (rewards, descriptions, etc.)
- **manager.js**: Core quest management functions (assign, update, complete, check)
- **index.js**: Event handlers and system initialization

### Client-side

- **client_packages/quests/manager.js**: Handles quest events and notifications
- **client_packages/quests/events.js**: Manages quest dialog display and interactions
- **client_packages/cef/quests/**: CEF UI files (HTML/CSS/JS) for the quest dialog

## Database Schema

The system automatically creates the `character_quests` table:

```sql
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
)
```

## Adding New Quests

To add a new quest, edit `packages/quests/definitions.js`:

```javascript
const quests = {
    intro_01: {
        id: 'intro_01',
        title: 'Welcome to Los Santos',
        description: 'Welcome! Go to the grocery store and buy some water.',
        reward: {
            money: 500
        },
        steps: 1
    },
    // Add your new quest here:
    new_quest_id: {
        id: 'new_quest_id',
        title: 'Quest Title',
        description: 'Quest description...',
        reward: {
            money: 1000,
            // items: [{ name: 'item_name', amount: 1 }] // Future feature
        },
        steps: 3
    }
};
```

## Using the Quest System

### Opening a Quest Dialog

From any server-side code (e.g., NPC interaction):

```javascript
if (global.questSystem && typeof global.questSystem.openQuestDialog === 'function') {
    global.questSystem.openQuestDialog(player, 'intro_01');
}
```

### Assigning a Quest Directly

```javascript
global.questSystem.assignQuest(player, 'intro_01');
```

### Updating Quest Progress

```javascript
global.questSystem.updateQuestStep(player, 'intro_01', 1);
```

### Completing a Quest

```javascript
global.questSystem.completeQuest(player, 'intro_01');
```

## Integration with NPC System

The quest system is already integrated with the NPC system. To create a quest-giving NPC, edit `packages/npc-system/npcData.js`:

```javascript
{
    id: 5,
    type: 'quest',
    model: 'a_f_m_eastsa_02',
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
```

When a player interacts with this NPC (presses 'E'), the quest dialog will automatically open.

## Testing Commands

Two test commands are available:

- `/testquest` - Opens the intro_01 quest dialog
- `/completequest [questId]` - Completes the specified quest (e.g., `/completequest intro_01`)

## Client Notifications

The system uses `mp.game.graphics.notify()` for in-game notifications:

- **Quest Started**: Green notification with quest title
- **Quest Updated**: Blue notification with current step
- **Quest Completed**: Yellow notification with rewards

## Quest Dialog UI

The quest dialog shows:
- Quest title
- Description
- Rewards (money, items)
- Accept/Decline buttons

The UI is styled with a modern gradient design and smooth animations.

## Events

### Server Events

- `character:loaded` - Loads active quests when character is selected
- `quest:accept` - Handles quest acceptance from the dialog

### Client Events

- `quest:start` - Triggered when a quest is assigned
- `quest:update` - Triggered when quest step is updated
- `quest:complete` - Triggered when quest is completed
- `quest:loadQuests` - Loads active quests on character load
- `quest:showDialog` - Opens the quest dialog UI

## Future Enhancements

Potential improvements for the quest system:

1. Item rewards support
2. Quest chains (prerequisites)
3. Multiple quest steps with objectives
4. Quest tracking UI
5. Quest log/journal
6. Experience rewards
7. Quest markers on map
8. Quest timers/deadlines
9. Repeatable quests
10. Quest categories/types
