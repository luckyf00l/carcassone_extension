// This script manages the persistent popup window and tracks tile data in memory

let trackerWindow = null;

// Initialize group data (in memory only)
const tileGroups = [
  { groupName: "1-12", played: 0, remaining: 12 },
  { groupName: "13-24", played: 0, remaining: 12 },
  { groupName: "25-36", played: 0, remaining: 12 },
  { groupName: "37-48", played: 0, remaining: 12 },
  { groupName: "49-60", played: 0, remaining: 12 },
  { groupName: "61-72", played: 0, remaining: 12 }
];

// Track which specific tiles have been played and their order
const playedTiles = new Set();
const playedTilesSequence = []; // Array to keep track of play order

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'tilePlayed') {
    updateTileCount(message.tileNumber, message.groupIndex);
  } else if (message.action === 'startedTracking') {
    console.log('Carcassonne Tracker: Game detected, tracking started');
  } else if (message.action === 'requestData') {
    // Send current data when requested by popup
    sendResponse({
      tileGroups: tileGroups,
      playedTilesSequence: playedTilesSequence,
      totalPlayed: playedTiles.size
    });
  }
  return true; // Keep the message channel open for async response
});

// Function to update the tile counts when a new tile is played
function updateTileCount(tileNumber, groupIndex) {
  // Prevent duplicate counting
  if (playedTiles.has(tileNumber)) {
    return;
  }
  
  // Add this tile to our tracking set and sequence
  playedTiles.add(tileNumber);
  playedTilesSequence.push({
    number: tileNumber,
    group: groupIndex + 1
  });
  
  // Update the group counters
  tileGroups[groupIndex].played++;
  tileGroups[groupIndex].remaining--;
  
  // Calculate total played
  const totalPlayed = playedTiles.size;
  
  console.log(`Carcassonne Tracker: Tile ${tileNumber} played, group ${groupIndex + 1} updated`);
  
  // If the tracker window is open, send a message to update the UI
  if (trackerWindow !== null) {
    chrome.runtime.sendMessage({
      action: 'updateUI',
      tileGroups: tileGroups,
      playedTilesSequence: playedTilesSequence,
      totalPlayed: totalPlayed
    });
  }
}

// Function to reset tracking data
function resetTracking() {
  // Reset all group counters
  for (let i = 0; i < tileGroups.length; i++) {
    tileGroups[i].played = 0;
    tileGroups[i].remaining = 12;
  }
  
  // Clear the played tiles set and sequence
  playedTiles.clear();
  playedTilesSequence.length = 0;
  
  console.log('Carcassonne Tracker: Tracking data reset');
  
  // Update the UI if window is open
  if (trackerWindow !== null) {
    chrome.runtime.sendMessage({
      action: 'updateUI',
      tileGroups: tileGroups,
      playedTilesSequence: playedTilesSequence,
      totalPlayed: 0
    });
  }
}

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(() => {
  // If a window is already open, focus it instead of opening a new one
  if (trackerWindow !== null) {
    chrome.windows.update(trackerWindow, { focused: true });
    return;
  }
  
  // Create a new popup window with our tracker
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 340,
    height: 450, // Increased height to accommodate play sequence
    focused: true
  }, (window) => {
    // Store the window id so we can check if it's already open
    trackerWindow = window.id;
  });
});

// Listen for when the window is closed to reset our reference
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === trackerWindow) {
    trackerWindow = null;
  }
});