// Content script that runs on the Board Game Arena website
// Monitors the DOM for new Carcassonne tiles being played

console.log('Carcassonne Tracker: Content script loaded');

// Map to track which tiles we've already detected
const detectedTiles = new Map();

// Function to determine which group a tile belongs to (1-6)
function getTileGroup(tileNumber) {
  if (tileNumber >= 1 && tileNumber <= 12) return 0;
  if (tileNumber >= 13 && tileNumber <= 24) return 1;
  if (tileNumber >= 25 && tileNumber <= 36) return 2;
  if (tileNumber >= 37 && tileNumber <= 48) return 3;
  if (tileNumber >= 49 && tileNumber <= 60) return 4;
  if (tileNumber >= 61 && tileNumber <= 72) return 5;
  return -1; // Not in any group
}

// Function to extract the tile number from an element ID
function extractTileNumber(id) {
  const match = id.match(/tile_(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Function to scan for tiles
function scanForTiles() {
  const tiles = document.querySelectorAll('[id^="tile_"]');
  console.log(`Carcassonne Tracker: Scanning for tiles, found ${tiles.length}`);
  
  tiles.forEach(tile => {
    const tileNumber = extractTileNumber(tile.id);
    
    if (tileNumber && !detectedTiles.has(tileNumber)) {
      // Check if the tile is visible
      const style = window.getComputedStyle(tile);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
      
      if (isVisible) {
        detectedTiles.set(tileNumber, true);
        console.log(`Carcassonne Tracker: New tile detected: ${tileNumber}`);
        
        // Determine which group this tile belongs to
        const groupIndex = getTileGroup(tileNumber);
        if (groupIndex !== -1) {
          // Send message to background script
          chrome.runtime.sendMessage({
            action: 'tilePlayed',
            tileNumber: tileNumber,
            groupIndex: groupIndex
          });
        }
      }
    }
  });
}

// Set up a simple polling mechanism (check every second)
setInterval(scanForTiles, 1000);

// Also scan immediately when the script loads
scanForTiles();

// Let the background script know we're tracking
chrome.runtime.sendMessage({
  action: 'startedTracking'
});

// For debugging - this should work from console
window.debugTiles = function() {
  const tiles = document.querySelectorAll('[id^="tile_"]');
  console.log(`Found ${tiles.length} tiles`);
  tiles.forEach(tile => {
    console.log(tile.id, {
      display: window.getComputedStyle(tile).display,
      visibility: window.getComputedStyle(tile).visibility,
      rect: tile.getBoundingClientRect()
    });
  });
  return tiles;
};