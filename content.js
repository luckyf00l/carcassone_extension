// This should run on Board Game Arena pages
console.log('Carcassonne Tracker: Content script is running!');

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

// Simple function to find tiles
function findTiles() {
  const tiles = document.querySelectorAll('[id^="tile_"]');
  console.log(`Found ${tiles.length} tiles`);
  return tiles;
}

// Run every 2 seconds
setInterval(findTiles, 2000);

// Make a test function available in console
window.testTracker = function() {
  return 'Tracker is working!';
};