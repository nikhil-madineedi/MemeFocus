# MemeFocus Deployment Summary

This document outlines the production stack, hosting platforms, and environment variables used for the MemeFocus Pomodoro and Website Blocker application.

---

## Production Stack & Services

| Component | Tech Stack | Hosting/Service Provider | Deployed URL / Details |
| :--- | :--- | :--- | :--- |
| **Frontend (Web App)** | React.js (Vite) <br> Vanilla CSS <br> Lucide Icons | **Vercel** <br> *(Free frontend hosting)* | `https://meme-focus.vercel.app` |
| **Backend (API)** | Java 17 <br> Spring Boot <br> Maven <br> Docker | **Render** <br> *(Free web service container)* | `https://memefocus.onrender.com` |
| **Database** | PostgreSQL | **Supabase** <br> *(Free cloud database)* | Hosted on Supabase <br> *(Connected to Render via environment variables)* |
| **Chrome Extension** | Manifest V3 <br> HTML / Vanilla JS / CSS | **Manual Unpacked Loading** <br> *(Zipped & hosted on the site)* | Downloadable at:<br> `https://meme-focus.vercel.app/extension.zip` |

---

## Environment Variables & Configurations

### 1. Render Backend Config
The following environment variables are set in the **Environment** tab of the Render web service settings:
* **`SPRING_DATASOURCE_URL`**: `jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require`
* **`SPRING_DATASOURCE_USERNAME`**: `postgres.bjhbkwhjretlpjaqnvyx`
* **`SPRING_DATASOURCE_PASSWORD`**: `110407#Mnikhil`

### 2. Vercel Frontend Config (`vercel.json`)
We use a standard single-page-routing override (`vercel.json`) in the frontend root to ensure React Router handles all sub-paths without throwing static 404s:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Local Development Execution

### Backend
Run locally on `http://localhost:8080` (requires setting environment variables or supplying them via command line):
```bash
cd backend
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
$env:SPRING_DATASOURCE_USERNAME="postgres.bjhbkwhjretlpjaqnvyx"
$env:SPRING_DATASOURCE_PASSWORD="110407#Mnikhil"
mvn spring-boot:run
```

### Frontend
Run local Vite development server on `http://localhost:5173`:
```bash
cd frontend
npm install
npm run dev
```

### Chrome Extension Installation
1. Go to `chrome://extensions` in Google Chrome.
2. Toggle **Developer mode** in the top-right corner to **ON**.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension` folder in the project root.
