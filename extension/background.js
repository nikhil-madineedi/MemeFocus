// background.js - Companion Chrome Extension Service Worker

let sessionState = {
  token: null,
  focusSessionActive: false,
  focusSessionExpiry: null
};

let blockedWebsites = [];
let lastFetchedToken = null;

// Fetch blocked websites from Spring Boot backend
async function fetchBlockedWebsites() {
  if (!sessionState.token) {
    blockedWebsites = [];
    return;
  }
  
  try {
    const response = await fetch('https://memefocus-backend.onrender.com/api/blocked-websites', {
      headers: {
        'X-Auth-Token': sessionState.token
      }
    });
    if (response.ok) {
      const data = await response.json();
      blockedWebsites = data;
      console.log('Synced blocked websites:', blockedWebsites);
    }
  } catch (err) {
    console.error('Failed to fetch blocked websites from backend:', err);
  }
}

// Listen for sync messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_SESSION") {
    sessionState.focusSessionActive = message.focusSessionActive;
    sessionState.focusSessionExpiry = message.focusSessionExpiry;
    sessionState.token = message.token;

    // Fetch blocklist if token changed or we haven't fetched it yet
    if (sessionState.token && sessionState.token !== lastFetchedToken) {
      lastFetchedToken = sessionState.token;
      fetchBlockedWebsites();
    } else if (!sessionState.token) {
      blockedWebsites = [];
      lastFetchedToken = null;
    }
  }
  
  // Respond to request for current timer details
  if (message.type === "GET_TIMER_STATUS") {
    sendResponse({
      focusSessionActive: sessionState.focusSessionActive,
      focusSessionExpiry: sessionState.focusSessionExpiry
    });
  }
  return true;
});

// Periodically refetch blocked sites if session is active
setInterval(() => {
  if (sessionState.token) {
    fetchBlockedWebsites();
  }
}, 5000);

// Check if a URL should be blocked
function shouldBlock(url) {
  if (!sessionState.focusSessionActive) return false;
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Do not block our own extension pages or local server
    if (url.startsWith(chrome.runtime.getURL('')) || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return false;
    }

    return blockedWebsites.some(site => {
      const blockedPattern = site.url.toLowerCase();
      return hostname === blockedPattern || hostname.endsWith('.' + blockedPattern);
    });
  } catch (e) {
    return false;
  }
}

// Redirect blocked tabs
function redirectTabIfBlocked(tabId, url) {
  if (shouldBlock(url)) {
    const redirectUrl = chrome.runtime.getURL("redirect/redirect.html") + "?original=" + encodeURIComponent(url);
    chrome.tabs.update(tabId, { url: redirectUrl });
  }
}

// Monitor tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    redirectTabIfBlocked(tabId, changeInfo.url);
  }
});

// Monitor navigations before they start loading
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Only block main page frame, not sub-frames
    redirectTabIfBlocked(details.tabId, details.url);
  }
});
