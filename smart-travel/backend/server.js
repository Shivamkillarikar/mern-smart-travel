/**
 * Smart Travel — Node.js / Express Backend
 * Acts as API gateway: forwards ML calls to FastAPI, fetches weather,
 * and calls Gemini for AI safety tips.
 */

const express  = require("express");
const cors     = require("cors");
const axios    = require("axios");
const dotenv   = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

const FASTAPI_URL   = process.env.FASTAPI_URL   || "http://localhost:8000";
const WEATHER_KEY   = process.env.WEATHER_API_KEY;
const GEMINI_KEY    = process.env.GEMINI_API_KEY;

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DEFAULT_TIPS = [
  "🚗 Inspect tires and fluid levels before a long journey",
  "💧 Stay hydrated and take breaks every 2 hours",
  "📱 Save emergency contacts and keep your phone charged",
];

function calcWeatherImpact(temp, windSpeed, rain) {
  return Math.max(0.8, Math.min(1.2,
    1 + (temp - 25) * 0.002 + windSpeed * 0.005 + rain * 0.01
  ));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /api/health */
app.get("/api/health", async (_req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/health`, { timeout: 3000 });
    res.json({ backend: "ok", ml_service: data });
  } catch {
    res.json({ backend: "ok", ml_service: "unreachable" });
  }
});

/** GET /api/cities */
app.get("/api/cities", async (_req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/cities`);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Could not reach ML service", details: err.message });
  }
});

/** GET /api/destinations/:start */
app.get("/api/destinations/:start", async (req, res) => {
  try {
    const { data } = await axios.get(`${FASTAPI_URL}/destinations/${encodeURIComponent(req.params.start)}`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: err.response?.data?.detail || "Failed" });
  }
});

/** POST /api/predict  body: { start, end, traffic, base_time } */
app.post("/api/predict", async (req, res) => {
  try {
    const { start, end, traffic, base_time } = req.body;

    // Fetch weather for origin (best-effort; fallback to 1.0)
    let weatherImpact = 1.0;
    let weatherData   = null;

    if (WEATHER_KEY) {
      try {
        const wr = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
          params: { q: `${start},IN`, appid: WEATHER_KEY, units: "metric" },
          timeout: 5000,
        });
        const w = wr.data;
        const temp      = w.main.temp;
        const windSpeed = w.wind.speed;
        const rain      = w.rain?.["1h"] ?? 0;
        weatherImpact   = calcWeatherImpact(temp, windSpeed, rain);
        weatherData     = { temp, windSpeed, rain, humidity: w.main.humidity,
                            description: w.weather[0].description,
                            icon: w.weather[0].icon, weatherImpact };
      } catch { /* silently degrade */ }
    }

    const { data } = await axios.post(`${FASTAPI_URL}/predict`, {
      start, end, traffic, base_time, weather_impact: weatherImpact,
    });

    res.json({ ...data, weather: weatherData });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.detail || "Prediction failed",
    });
  }
});

/** GET /api/weather/:city */
app.get("/api/weather/:city", async (req, res) => {
  if (!WEATHER_KEY) return res.status(501).json({ error: "Weather API key not configured" });

  try {
    const { data: w } = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { q: `${req.params.city},IN`, appid: WEATHER_KEY, units: "metric" },
      timeout: 5000,
    });

    const temp      = w.main.temp;
    const windSpeed = w.wind.speed;
    const rain      = w.rain?.["1h"] ?? 0;

    res.json({
      city:         req.params.city,
      temp,
      windSpeed,
      rain,
      humidity:     w.main.humidity,
      description:  w.weather[0].description,
      icon:         w.weather[0].icon,
      weatherImpact: calcWeatherImpact(temp, windSpeed, rain),
    });
  } catch (err) {
    res.status(200).json({
      city: req.params.city,
      temp: null,
      weatherImpact: 1.0,
      error: "Weather unavailable",
    });
  }
});

/** POST /api/safety-tips  body: { temp, windSpeed, rain, route } */
app.post("/api/safety-tips", async (req, res) => {
  const { temp, windSpeed, rain, route } = req.body;

  if (!genAI) return res.json({ tips: DEFAULT_TIPS });

  try {
    const gemModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a friendly Indian road-trip safety assistant.
Weather conditions along the route "${route}":
  • Temperature : ${temp}°C
  • Wind Speed  : ${windSpeed} m/s
  • Rainfall    : ${rain} mm/h

Return EXACTLY 3 concise travel safety tips as a raw JSON array of strings (no markdown, no extra text):
["🚗 tip one", "💧 tip two", "⚠️ tip three"]`;

    const result = await gemModel.generateContent(prompt);
    const raw    = result.response.text().trim().replace(/```json\n?|\n?```/g, "");

    try {
      const tips = JSON.parse(raw);
      res.json({ tips: Array.isArray(tips) ? tips.slice(0, 3) : DEFAULT_TIPS });
    } catch {
      const lines = raw.split("\n").filter(l => l.trim().length > 0).slice(0, 3);
      res.json({ tips: lines.length ? lines : DEFAULT_TIPS });
    }
  } catch {
    res.json({ tips: DEFAULT_TIPS });
  }
});

/** GET /api/compare/:start/:end  — route comparison chart data */
app.get("/api/compare/:start/:end", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${FASTAPI_URL}/compare/${encodeURIComponent(req.params.start)}/${encodeURIComponent(req.params.end)}`
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 502).json({ error: "Comparison failed" });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Smart Travel API running on http://localhost:${PORT}`));
