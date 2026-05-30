// redirect.js - Block Page script

const roastTextEl = document.getElementById('roast-text');
const memeLoadingEl = document.getElementById('meme-loading');
const memeImageEl = document.getElementById('meme-image');
const memeTitleEl = document.getElementById('meme-title');
const timerDisplayEl = document.getElementById('timer-display');
const closeTabBtn = document.getElementById('close-tab');

// 1. Curated Roasts list
const ROASTS = [
  "Why are you here? That code isn't going to debug itself! 💻",
  "Did you compile your willpower with errors? Go back to work! ⚙️",
  "ChatGPT can't save your career if you spend all day scrolling. Back to focus! 🤖",
  "Oh look, scrolling while your repository builds. Get back to writing code! 📦",
  "Your CPU is working harder than you are right now. Back to the editor! 🧠",
  "Is this how you become a Senior Developer? By slacking off? Get back to work! 👔",
  "There are 10 types of people in the world: those who stay focused, and you. Back to coding! 🔢",
  "StackOverflow is waiting for your contributions. Go write some code! 🌐"
];

// Display a random roast
const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
roastTextEl.textContent = randomRoast;

// 2. Fetch programmer meme from public API
async function loadMeme() {
  try {
    const response = await fetch('https://meme-api.com/gimme/programmerhumor');
    if (!response.ok) throw new Error('API failed');
    const data = await response.json();
    
    if (data && data.url) {
      memeImageEl.src = data.url;
      memeImageEl.style.display = 'block';
      memeTitleEl.textContent = data.title || 'Programmer humor';
      memeTitleEl.style.display = 'block';
      memeLoadingEl.style.display = 'none';
    }
  } catch (err) {
    console.log('Failed to fetch meme online, loading offline fallback joke.', err);
    // Offline text-based programming joke fallback
    memeLoadingEl.innerHTML = `
      <div style="padding: 1rem; border: 1px dashed #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
        <p style="font-weight: 600; margin-bottom: 0.5rem; color: #4f46e5;">Offline Joke Fallback:</p>
        <p style="font-style: italic; font-size: 1.05rem;">"Why do programmers wear glasses? <br>Because they can't C#!"</p>
      </div>
    `;
  }
}

// 3. Countdown timer synced with background
let timerInterval = null;

function startTimer() {
  chrome.runtime.sendMessage({ type: "GET_TIMER_STATUS" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      return;
    }

    if (response.focusSessionActive && response.focusSessionExpiry) {
      if (timerInterval) clearInterval(timerInterval);

      const tick = () => {
        const remainingMs = response.focusSessionExpiry - Date.now();
        if (remainingMs <= 0) {
          clearInterval(timerInterval);
          timerDisplayEl.textContent = "00:00";
          timerDisplayEl.style.color = "#10b981"; // green
          roastTextEl.textContent = "Focus session is over! You may now browse freely. 🎉";
          roastTextEl.style.color = "#047857";
          document.querySelector('.roast-card').style.backgroundColor = "#d1fae5";
          document.querySelector('.roast-card').style.borderLeftColor = "#10b981";
        } else {
          const seconds = Math.floor(remainingMs / 1000);
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          timerDisplayEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      };

      tick();
      timerInterval = setInterval(tick, 1000);
    } else {
      timerDisplayEl.textContent = "00:00";
    }
  });
}

// 4. Action button handlers
closeTabBtn.addEventListener('click', () => {
  chrome.tabs.getCurrent((tab) => {
    if (tab) {
      chrome.tabs.remove(tab.id);
    } else {
      window.close();
    }
  });
});


// Load resources on mount
loadMeme();
startTimer();
// Poll timer status in case they start it elsewhere
setInterval(startTimer, 2000);
