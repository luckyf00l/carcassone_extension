// This script handles the popup UI updates

// When the popup loads, update the UI with current data
document.addEventListener('DOMContentLoaded', function() {
  // Request data from background script
  chrome.runtime.sendMessage({ action: 'requestData' }, function(response) {
    if (response) {
      updateUIWithData(response.tileGroups, response.playedTilesSequence, response.totalPlayed);
    }
  });
  
  // Listen for messages from the background script to update in real-time
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateUI') {
      updateUIWithData(message.tileGroups, message.playedTilesSequence, message.totalPlayed);
    }
  });
});

// Function to update the UI with the provided data
function updateUIWithData(tileGroups, playedTilesSequence, totalPlayed) {
  // Update the total count
  const totalElement = document.querySelector('.balance-value');
  if (totalElement) {
    totalElement.textContent = `${totalPlayed} / 72`;
  }
  
  // Update each individual group
  for (let i = 0; i < tileGroups.length; i++) {
    const groupNumber = i + 1;
    const playedElement = document.getElementById(`played${groupNumber}`);
    const remainingElement = document.getElementById(`remaining${groupNumber}`);
    
    if (playedElement && remainingElement) {
      playedElement.textContent = tileGroups[i].played;
      remainingElement.textContent = tileGroups[i].remaining;
    }
  }
  
  // Update the play sequence display
  updatePlaySequence(playedTilesSequence);
}

// Function to update the play sequence display
function updatePlaySequence(playedTilesSequence) {
  const sequenceContainer = document.getElementById('playedTilesSequence');
  if (!sequenceContainer) return;
  
  // Clear existing cards
  sequenceContainer.innerHTML = '';
  
  // Add cards for each played tile
  playedTilesSequence.forEach(tile => {
    const tileCard = document.createElement('div');
    tileCard.className = `tile-card group-${tile.group}`;
    tileCard.textContent = tile.number;
    sequenceContainer.appendChild(tileCard);
  });
  
  // If no tiles have been played, show a placeholder message
  if (playedTilesSequence.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.style.color = '#9ca3af';
    placeholder.style.fontStyle = 'italic';
    placeholder.textContent = 'No tiles played yet';
    sequenceContainer.appendChild(placeholder);
  }
}