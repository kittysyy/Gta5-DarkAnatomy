let currentQuestId = null;

// Function to send event to client
function callClient(eventName, ...args) {
    if (typeof mp !== 'undefined' && mp.trigger) {
        mp.trigger(eventName, ...args);
    }
}

// Show quest dialog
function showQuestDialog(questData) {
    try {
        const data = typeof questData === 'string' ? JSON.parse(questData) : questData;
        
        currentQuestId = data.questId;
        
        // Update quest information
        document.getElementById('questTitle').textContent = data.title || 'Quest';
        document.getElementById('questDescription').textContent = data.description || 'No description available.';
        
        // Update rewards list
        const rewardsList = document.getElementById('rewardsList');
        rewardsList.innerHTML = '';
        
        if (data.reward) {
            if (data.reward.money) {
                const li = document.createElement('li');
                li.textContent = `Money: $${data.reward.money}`;
                rewardsList.appendChild(li);
            }
            
            if (data.reward.items) {
                data.reward.items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.name} x${item.amount}`;
                    rewardsList.appendChild(li);
                });
            }
        }
        
        // Show dialog
        document.getElementById('questDialog').classList.remove('hidden');
        
        // Enable cursor
        callClient('setCursorVisible', true);
    } catch (error) {
        console.error('Error showing quest dialog:', error);
    }
}

// Hide quest dialog
function hideQuestDialog() {
    document.getElementById('questDialog').classList.add('hidden');
    currentQuestId = null;
    
    // Disable cursor
    callClient('setCursorVisible', false);
}

// Accept quest button handler
document.getElementById('acceptBtn').addEventListener('click', () => {
    if (currentQuestId) {
        callClient('quest:acceptFromDialog', currentQuestId);
        hideQuestDialog();
    }
});

// Decline quest button handler
document.getElementById('declineBtn').addEventListener('click', () => {
    hideQuestDialog();
});

// Listen for events from client
if (typeof mp !== 'undefined') {
    mp.events.add('showQuestDialog', (questData) => {
        showQuestDialog(questData);
    });
    
    mp.events.add('hideQuestDialog', () => {
        hideQuestDialog();
    });
}
