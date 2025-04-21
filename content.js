// Content script that runs on the Board Game Arena website
// Monitors the DOM for new Carcassonne tiles being played

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
  // Extract number from format "tile_XX"
  const match = id.match(/tile_(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Create a MutationObserver to detect when tiles are added to the DOM
function setupTileObserver() {
  console.log('Carcassonne Tracker: Setting up tile observer');
  
  // First try different possible container selectors
  const possibleContainers = [
    document.getElementById('map_scrollable_oversurface'),
    document.getElementById('map_container'),
    document.getElementById('map_surface'),
    document.getElementById('game_play_area'),
    document.getElementById('board'),
    document.body // Last resort: observe the entire body
  ];
  
  let targetNode = null;
  
  // Find the first existing container
  for (let container of possibleContainers) {
    if (container) {
      targetNode = container;
      console.log(`Carcassonne Tracker: Using container ${container.id || 'document.body'}`);
      break;
    }
  }
  
  if (!targetNode) {
    console.log('Carcassonne Tracker: No suitable container found, will retry in 2 seconds');
    setTimeout(setupTileObserver, 2000);
    return;
  }

  // Configure the observer to look for changes to the DOM
  const config = { 
    childList: true, 
    subtree: true,
    attributes: true, // Also observe attribute changes in case tiles are revealed differently
    attributeFilter: ['id', 'class', 'style'] // Monitor these attributes for changes
  };

  // Callback function executed when mutations are observed
  const callback = function(mutationsList) {
    for (const mutation of mutationsList) {
      // Handle added nodes
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          checkNodeForTile(node);
        });
      }
      
      // Handle attribute changes (in case tiles are shown/hidden via attributes)
      if (mutation.type === 'attributes' && mutation.target.id) {
        checkNodeForTile(mutation.target);
      }
    }
  };

  // Create an observer instance
  const observer = new MutationObserver(callback);

  // Start observing the target node
  observer.observe(targetNode, config);
  console.log('Carcassonne Tracker: Observer started on', targetNode.id || 'document.body');
  
  // Also scan existing tiles right after starting the observer
  scanExistingTiles();
}

// Function to check if a node is or contains a tile
function checkNodeForTile(node) {
  // If this is not an element node, skip it
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  
  // Check if this element has a tile ID
  if (node.id && node.id.startsWith('tile_')) {
    processTile(node);
  }
  
  // Also check all child elements
  if (node.children) {
    const tileElements = node.querySelectorAll('[id^="tile_"]');
    tileElements.forEach(processTile);
  }
}

// Function to process a found tile element
function processTile(tileElement) {
  const tileNumber = extractTileNumber(tileElement.id);
  
  // Check if this is a valid tile that we haven't detected before
  if (tileNumber && !detectedTiles.has(tileNumber)) {
    // Check if the tile is visible (not hidden)
    const isVisible = tileElement.offsetParent !== null || 
                     getComputedStyle(tileElement).display !== 'none';
    
    if (isVisible) {
      detectedTiles.set(tileNumber, true);
      
      console.log(`Carcassonne Tracker: Detected tile ${tileNumber}`);
      
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
}

// Also scan for existing tiles on the page
function scanExistingTiles() {
  const tiles = document.querySelectorAll('[id^="tile_"]');
  console.log(`Carcassonne Tracker: Found ${tiles.length} existing tiles`);
  
  tiles.forEach(processTile);
}

// Initialize when the page is loaded
function initialize() {
  console.log('Carcassonne Tracker: Initializing content script');
  
  // First check if we're on a Carcassonne game page
  if (window.location.href.includes('boardgamearena.com')) {
    console.log('Carcassonne Tracker: On Board Game Arena page');
    
    // Wait a bit for the page to fully render
    setTimeout(() => {
      // Scan for existing tiles
      scanExistingTiles();
      
      // Set up observer for new tiles
      setupTileObserver();
      
      // Let the background script know we're tracking
      chrome.runtime.sendMessage({
        action: 'startedTracking'
      });
    }, 1000); // Give the page 1 second to load
  } else {
    console.log('Carcassonne Tracker: Not on Board Game Arena');
  }
}

// Wait for the page to be fully loaded or run immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also reinitialize if the URL changes (for single-page navigation)
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('Carcassonne Tracker: URL changed, reinitializing');
    detectedTiles.clear(); // Clear detected tiles when navigating
    initialize();
  }
}).observe(document, {subtree: true, childList: true});

// Debug function to manually check for tiles (can be called from console)
window.carcassonneTrackerDebug = function() {
  const tiles = document.querySelectorAll('[id^="tile_"]');
  console.log(`Found ${tiles.length} tiles:`, Array.from(tiles).map(t => t.id));
  return tiles;
};