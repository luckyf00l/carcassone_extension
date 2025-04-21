// This script launches a popup window when the extension icon is clicked
// The window will persist until explicitly closed by the user

let trackerWindow = null;

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
    height: 400,
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