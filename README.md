# MemeFocus

**MemeFocus** is a simple, lightweight, full-stack productivity tool that combines a Pomodoro timer, task management, website blocking, and a companion Chrome extension. 

The twist: if you try to visit blacklisted websites during an active focus block, the Chrome extension automatically redirects you to funny programmer memes and motivational roasts to nudge you back to work!

---

## Directory Structure

```text
MemeFocus/
├── backend/            # Spring Boot REST API (Java 17+, Maven, MySQL DB)
├── frontend/           # React Single Page Application (Vite, JS, Vanilla CSS)
└── extension/          # Manifest V3 Chrome Extension (HTML, CSS, JS)
```

---

## Tech Stack & Design
- **Backend**: Spring Boot 3.x, MySQL Database.
- **Frontend**: React.js 18.x, React Router, Lucide Icons, Vanilla CSS (clean, light, and minimal UI with independent component files).
- **Chrome Extension**: Vanilla JavaScript (Manifest V3, tab monitoring, and local custom redirect pages).

---

## Quickstart Guide

### 1. Run the Backend (Spring Boot)
Ensure you have Java 17+ and Maven installed.
```bash
cd backend
mvn spring-boot:run
```
- The backend server will run on: `http://localhost:8080`
- It connects to a local MySQL instance. Default properties assume a username of `root` and no password. The database `memefocus` will be automatically generated upon initial startup. You can customize database connection credentials inside `backend/src/main/resources/application.properties`.

### 2. Run the Frontend (React JS)
Ensure you have Node.js installed.
```bash
cd frontend
npm install
npm run dev
```
- The frontend dev server will launch on: `http://localhost:5173`

### 3. Load the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click the **Load unpacked** button in the top left.
4. Select the `extension/` folder located in the root of this project.
5. The extension is now loaded! You can pin it to your toolbar to inspect the connection badge.

---

## Workflow Validation

1. **Sign Up / Log In**: Open the website at `http://localhost:5173`, go to **Sign Up**, and register a developer account.
2. **Setup Blacklist**: Navigate to the **Blocked Sites** tab. Verify the sidebar card shows **Chrome Extension: Connected** (it will turn green once loaded). Add a test website (e.g. `facebook.com` or `reddit.com`).
3. **Select Task**: Navigate to the **Tasks** page and add a few coding tasks.
4. **Run Timer**: Go to the **Timer** page, pick a task in the dropdown, and click **Start**.
5. **Test Website Blocking**: While the timer is ticking down, open a new Chrome tab and visit the blocked website (e.g. `https://facebook.com`). The extension will instantly block navigation and redirect you to the Meme Redirect Page, showing you a countdown timer and a programmer meme!
6. **Complete Session**: Once the focus timer runs out, a chime plays, the session is recorded on the backend, and your daily streak increases! Check your progress grid on the **Dashboard** page.
