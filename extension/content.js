// content.js
// Inject identifiers into the document so the React app knows the extension is installed
document.documentElement.dataset.memefocusExtensionActive = "true";

document.addEventListener("DOMContentLoaded", () => {
  if (document.body) {
    document.body.dataset.memefocusExtensionActive = "true";
  }
});

// Sync data between React localStorage and Extension Background worker
const syncWithBackground = () => {
  const token = localStorage.getItem('token');
  const focusSessionActive = localStorage.getItem('focusSessionActive') === 'true';
  const focusSessionExpiry = localStorage.getItem('focusSessionExpiry');

  chrome.runtime.sendMessage({
    type: "SYNC_SESSION",
    token: token || null,
    focusSessionActive,
    focusSessionExpiry: focusSessionExpiry ? parseInt(focusSessionExpiry) : null
  });
};

// Start sync loops
syncWithBackground();
setInterval(syncWithBackground, 1500);
