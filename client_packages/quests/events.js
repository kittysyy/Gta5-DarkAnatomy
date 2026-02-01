// Quest Events - Client-side
// Handles quest dialog display and interactions

let questBrowser = null;
let cursorVisible = false;

// Initialize quest browser
function initQuestBrowser() {
    if (!questBrowser) {
        questBrowser = mp.browsers.new('package://cef/quests/index.html');
    }
}

// Show quest dialog
mp.events.add('quest:showDialog', (questDataJson) => {
    try {
        initQuestBrowser();
        
        // Show cursor
        mp.gui.cursor.show(true, true);
        cursorVisible = true;
        
        // Send quest data to CEF - properly escape the JSON string
        const escapedJson = questDataJson
            .replace(/\\/g, "\\\\")  // Escape backslashes first
            .replace(/'/g, "\\'")     // Escape single quotes
            .replace(/\n/g, "\\n")    // Escape newlines
            .replace(/\r/g, "\\r");   // Escape carriage returns
        questBrowser.execute(`showQuestDialog('${escapedJson}')`);
        
        console.log('[Quests] Showing quest dialog');
    } catch (error) {
        console.error('[Quests] Error showing quest dialog:', error);
    }
});

// Handle cursor visibility from CEF
mp.events.add('setCursorVisible', (visible) => {
    mp.gui.cursor.show(visible, visible);
    cursorVisible = visible;
});

// Handle quest accept from dialog
mp.events.add('quest:acceptFromDialog', (questId) => {
    try {
        // Hide cursor
        if (cursorVisible) {
            mp.gui.cursor.show(false, false);
            cursorVisible = false;
        }
        
        // Send accept event to server
        mp.events.callRemote('quest:accept', questId);
        
        console.log('[Quests] Accepted quest from dialog:', questId);
    } catch (error) {
        console.error('[Quests] Error accepting quest from dialog:', error);
    }
});

console.log('[Quests] Client quest events initialized');
