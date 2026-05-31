# MemeFocus

**MemeFocus** is a full-stack developer productivity tool that combines a Pomodoro timer, task management, website blocking, and a companion Chrome extension. 

The twist: if you try to visit blacklisted websites during an active focus block, the Chrome extension automatically redirects you to funny programmer memes and roasts to force you back to work!

---

## Production Deployment URLs

* **Live Frontend Website**: [https://meme-focus.vercel.app](https://meme-focus.vercel.app)
* **Live Backend API**: [https://memefocus.onrender.com](https://memefocus.onrender.com)
* **Chrome Companion Extension ZIP**: Downloadable directly from the homepage or [https://meme-focus.vercel.app/extension.zip](https://meme-focus.vercel.app/extension.zip)

---

## Directory Structure

```text
MemeFocus/
├── backend/            # Spring Boot REST API (Java 17, Maven, PostgreSQL DB)
├── frontend/           # React Single Page Application (Vite, JS, Vanilla CSS)
├── extension/          # Manifest V3 Chrome Extension (HTML, CSS, JS)
└── DEPLOYMENT.md       # Detailed deployment logs and connection guidelines
```

---

## Tech Stack & Architecture

* **Backend**: Spring Boot 3.x, Hibernate JPA, PostgreSQL.
* **Frontend**: React.js 18.x, React Router, Lucide Icons, Vanilla CSS (clean, light, and minimal UI with modular page-separated CSS). Features a fully integrated distraction-free **Focus Player** with YouTube/Vimeo integration, auto-resume progress state, and custom CSS cinema/theater modes.
* **Chrome Extension**: Vanilla JavaScript (Manifest V3, tab monitoring, tab redirect, and local custom redirect pages matching Vercel & Render).
* **Database**: Cloud PostgreSQL database hosted on **Supabase**.

---

## Quickstart Guide

### 1. Run the Backend (Spring Boot) Locally
Ensure you have Java 17+ and Maven installed.
```bash
cd backend
mvn spring-boot:run
```
* **Local REST API**: `http://localhost:8080`
* **Production REST API**: Automatically builds on **Render** via Docker and binds to the dynamic `$PORT`.

### 2. Run the Frontend (React JS) Locally
Ensure you have Node.js installed.
```bash
cd frontend
npm install
npm run dev
```
* **Local Website**: `http://localhost:5173`
* **Production Website**: Deployed and hosted on **Vercel**.

### 3. Load the Chrome Extension
1. Download `extension.zip` from your live website (or use the local `extension/` folder).
2. Unzip/extract the zip file on your computer.
3. Open Google Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click the **Load unpacked** button (top-left) and select the extracted folder.
6. The extension is now loaded! You can pin it to your toolbar.

---

## Workflow Validation

1. **Sign Up / Log In**: Open the website at `https://meme-focus.vercel.app`, go to **Sign Up**, and register a developer account.
2. **Setup Blacklist**: Navigate to the **Blocked Sites** tab. Verify the sidebar card shows **Chrome Extension: Connected** (it will turn green once loaded). Add a test website (e.g. `youtube.com` or `reddit.com`).
3. **Select Task**: Navigate to the **Tasks** page and add a few coding tasks.
4. **Run Timer**: Go to the **Timer** page, pick a task in the dropdown, and click **Start**.
5. **Test Website Blocking**: While the timer is ticking down, open a new Chrome tab and visit the blocked website (e.g. `https://reddit.com`). The extension will instantly block navigation and redirect you to the Meme Redirect Page, showing you a countdown timer and a random developer meme!
6. **Complete Session**: Once the focus timer runs out, a chime plays, the session is recorded on the backend, and your daily streak increases! Check your progress grid on the **Dashboard** page.
7. **Use Focus Player**: Click **Focus Player** in the navigation bar. Paste a video URL (YouTube, Vimeo, or direct MP4 link). Use the player to take timeline-synchronized study notes (using keys like `Alt+N` or clicking the sync buttons). Click on note timestamps to seek the video, choose your layout (Split Screen, Theater, or Cinema Focus mode), and export your notes as Markdown format!
