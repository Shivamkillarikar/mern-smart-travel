# 🗺️ Smart Travel — AI-Powered Route Intelligence

> Weather-aware, ML-enhanced travel time predictions for routes across India.
> Built on a **MERN + FastAPI** microservice architecture with a premium dark-mode dashboard.

---

## ✨ Features

| Feature | Detail |
|---|---|
| 🔮 **ML Predictions** | Random Forest model (`final.pkl`) predicts travel time from distance, traffic, weather & base time |
| 🌦️ **Live Weather** | OpenWeatherMap API fetches real-time conditions per city; computes a weather-impact multiplier |
| 🤖 **AI Safety Tips** | Google Gemini 1.5 Flash generates 3 personalised travel safety tips per route |
| 🗺️ **Interactive Map** | React-Leaflet dark-mode map with animated gold polyline, city markers & checkpoint stops |
| 📊 **Route Comparison** | Recharts bar chart shows Light / Normal / Heavy traffic time scenarios |
| ⚡ **Autocomplete Search** | City search with fuzzy filtering for all Indian cities in the dataset |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React + Tailwind + Framer Motion)                 │
│  Port 5173 (dev) / 80 (Docker)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api/*
┌──────────────────────────▼──────────────────────────────────┐
│  Express.js API Gateway                 Node.js  :5000      │
│  • Proxies ML calls → FastAPI                               │
│  • Fetches weather (OpenWeatherMap)                         │
│  • Calls Gemini for safety tips                             │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP
┌────────────▼────────────────────────────────────────────────┐
│  FastAPI ML Microservice                Python  :8000       │
│  • Loads / trains final.pkl (RandomForestRegressor)         │
│  • POST /predict  → predicted travel time                   │
│  • GET  /compare  → 3 traffic-scenario predictions          │
│  • GET  /cities   → list of cities                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local — No Docker)

### 1. Python ML Microservice

```bash
cd python-service

# Copy your dataset
cp /path/to/india.csv .
# (optional) copy pre-trained model
cp /path/to/final.pkl .

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The service **auto-trains** a new Random Forest if `final.pkl` is absent.

---

### 2. Express Backend

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# → Fill in WEATHER_API_KEY and GEMINI_API_KEY

npm run dev     # nodemon hot-reload
# or
npm start
```

---

### 3. React Frontend

```bash
cd frontend
npm install
npm run dev
# → Opens http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:5000`.

---

## 🐳 Docker (Full Stack)

```bash
# 1. Create backend .env from template
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 2. Place dataset next to Dockerfile
cp /path/to/india.csv python-service/india.csv

# 3. Launch everything
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| ML Service | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 🔑 Environment Variables

### `backend/.env`

```env
FASTAPI_URL=http://localhost:8000
WEATHER_API_KEY=your_openweathermap_key   # openweathermap.org/api
GEMINI_API_KEY=your_gemini_key            # aistudio.google.com/app/apikey
PORT=5000
FRONTEND_URL=http://localhost:5173
```

> **Without API keys**: the app degrades gracefully — weather shows `N/A`, safety tips show sensible defaults.

---

## 📁 Project Structure

```
smart-travel/
├── python-service/         # FastAPI ML microservice
│   ├── main.py             # API routes + model loading
│   ├── requirements.txt
│   ├── india.csv           # ← place dataset here
│   └── final.pkl           # ← place / will be auto-generated
│
├── backend/                # Express.js API gateway
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── App.jsx                    # Layout orchestrator
│   │   ├── components/
│   │   │   ├── TopBar.jsx             # Header with live clock
│   │   │   ├── Sidebar.jsx            # Search, traffic, controls
│   │   │   ├── MapView.jsx            # React-Leaflet dark map
│   │   │   ├── PredictionCard.jsx     # ML result display
│   │   │   ├── WeatherCard.jsx        # Live weather + impact
│   │   │   ├── SafetyTipsCard.jsx     # Gemini AI tips
│   │   │   ├── RouteComparisonChart.jsx # Recharts bar chart
│   │   │   └── ErrorBanner.jsx
│   │   ├── hooks/
│   │   │   └── useTravel.js           # All API state management
│   │   └── utils/
│   │       └── constants.js           # City coords, config
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── docker-compose.yml
```

---

## 🤖 ML Model Details

| Parameter | Value |
|---|---|
| Algorithm | `RandomForestRegressor` |
| Estimators | 200 |
| Features | `Distance_km`, `Traffic`, `Base_Time`, `Weather_Impact` |
| Target | `Adjusted_Time` (minutes) |
| Train/Test split | 70/30 |

The **weather impact** multiplier is computed as:
```
impact = clamp(1 + (temp - 25) × 0.002 + wind × 0.005 + rain × 0.01, 0.8, 1.2)
```

---

## 🎨 Design System

- **Font**: Syne (display) + DM Sans (body) + JetBrains Mono (numbers)
- **Palette**: Navy `#0a0f1e` base · Gold `#f59e0b` accent · Glassmorphism cards
- **Animations**: Framer Motion page transitions · CSS shimmer skeletons
- **Map**: OpenStreetMap tiles with CSS filter inversion for dark mode
