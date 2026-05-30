// popup.js - Extension popup script

const badgeEl = document.getElementById('badge');
const statusTextEl = document.getElementById('status-text');
const countdownEl = document.getElementById('countdown');
const openAppBtn = document.getElementById('open-app');

let timerInterval = null;

// Query background script for current focus session status
function updatePopup() {
  chrome.runtime.sendMessage({ type: "GET_TIMER_STATUS" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Background script not ready yet.");
      return;
    }

    if (response && response.focusSessionActive && response.focusSessionExpiry) {
      badgeEl.textContent = "Focus";
      badgeEl.className = "badge active";
      statusTextEl.textContent = "Focus session is active!";
      
      // Clear existing intervals
      if (timerInterval) clearInterval(timerInterval);
      
      // Start local ticking interval
      const tick = () => {
        const remainingMs = response.focusSessionExpiry - Date.now();
        if (remainingMs <= 0) {
          clearInterval(timerInterval);
          countdownEl.textContent = "00:00";
          badgeEl.textContent = "Off";
          badgeEl.className = "badge off";
          statusTextEl.textContent = "Session complete!";
        } else {
          const seconds = Math.floor(remainingMs / 1000);
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      };
      
      tick();
      timerInterval = setInterval(tick, 1000);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      badgeEl.textContent = "Off";
      badgeEl.className = "badge off";
      statusTextEl.textContent = "Timer is not running.";
      countdownEl.textContent = "00:00";
    }
  });
}

// Open web app dashboard
openAppBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: "http://localhost:5173" });
});

// Load immediately
updatePopup();
// Polling fallback
setInterval(updatePopup, 2000);
