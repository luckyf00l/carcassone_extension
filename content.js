// Content script that runs on Board Game Arena website
console.log('Carcassonne Tracker: Content script is running!');

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
  console.log(`Carcassonne Tracker: Found ${tiles.length} elements with tile IDs`);
  
  tiles.forEach(tile => {
    const tileNumber = extractTileNumber(tile.id);
    
    if (tileNumber && !detectedTiles.has(tileNumber)) {
      // Check if the tile is visible
      const style = window.getComputedStyle(tile);
      const isVisible = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0';
      
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

// Run every 2 seconds
setInterval(scanForTiles, 2000);

// Also scan immediately when the script loads
scanForTiles();

// Let the background script know we're tracking
chrome.runtime.sendMessage({
  action: 'startedTracking'
});

// Debug function for testing
window.debugTiles = function() {
  const tiles = document.querySelectorAll('[id^="tile_"]');
  console.log(`Debug: Found ${tiles.length} tile elements`);
  tiles.forEach(tile => {
    const style = window.getComputedStyle(tile);
    console.log(`Tile ${tile.id}:`, {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: style.width,
      height: style.height
    });
  });
  return tiles;
};

// Create a visual indicator to show the script is loaded
const indicator = document.createElement('div');
indicator.style.position = 'fixed';
indicator.style.bottom = '10px';
indicator.style.right = '10px';
indicator.style.padding = '5px 10px';
indicator.style.backgroundColor = 'green';
indicator.style.color = 'white';
indicator.style.zIndex = '9999';
indicator.textContent = 'Tracker Active';
document.body.appendChild(indicator);