"""
Smart Travel - FastAPI ML Microservice
Loads final.pkl (Random Forest) and exposes prediction + data endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Travel ML Microservice",
    description="Predicts travel time between Indian cities using Random Forest + weather impact",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global state ────────────────────────────────────────────────────────────
MODEL_PATH = Path(__file__).parent / "final.pkl"
DATA_PATH  = Path(__file__).parent / "india.csv"

model: object = None
df: pd.DataFrame = None


def train_and_save_model(data: pd.DataFrame):
    """Train a new Random Forest model and persist to disk."""
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split

    data["Weather_Impact"] = 1.0
    data["Adjusted_Time"] = data["Time_Minutes"] * data["Weather_Impact"]

    X = data[["Distance_km", "Traffic", "Base_Time", "Weather_Impact"]]
    y = data["Adjusted_Time"]

    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.3, random_state=42)

    rf = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    joblib.dump(rf, MODEL_PATH)
    logger.info("✅  Model trained and saved to %s", MODEL_PATH)
    return rf


@app.on_event("startup")
async def startup_event():
    global model, df

    if not DATA_PATH.exists():
        raise RuntimeError(f"Dataset not found: {DATA_PATH}. Place india.csv next to main.py.")

    df = pd.read_csv(DATA_PATH)
    logger.info("📊  Loaded %d route records.", len(df))

    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        logger.info("🤖  Loaded pre-trained model from %s", MODEL_PATH)
    else:
        logger.warning("⚠️   final.pkl not found – training a fresh model …")
        model = train_and_save_model(df.copy())


# ─── Schemas ─────────────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    start: str
    end: str
    traffic: float           # 1.0 – 1.5
    base_time: float         # minutes
    weather_impact: float = 1.0  # computed by backend from weather API


class PredictionResponse(BaseModel):
    predicted_time: float    # minutes
    distance_km: float
    checkpoints: list[str]
    base_time: float
    traffic_multiplier: float
    weather_impact: float
    confidence_pct: float    # indicative model confidence


class RouteComparison(BaseModel):
    label: str
    predicted_time: float
    distance_km: float
    via: str
    traffic: float


# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "records": len(df) if df is not None else 0
    }


@app.get("/cities")
async def list_cities():
    if df is None:
        raise HTTPException(503, "Dataset not loaded")
    cities = sorted(set(df["Start"].unique()) | set(df["End"].unique()))
    return {"cities": cities}


@app.get("/destinations/{start}")
async def destinations_for_start(start: str):
    if df is None:
        raise HTTPException(503, "Dataset not loaded")
    ends = df[df["Start"] == start]["End"].unique().tolist()
    if not ends:
        raise HTTPException(404, f"No routes found originating from '{start}'")
    return {"destinations": sorted(ends)}


@app.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest):
    if model is None or df is None:
        raise HTTPException(503, "ML service not ready")

    routes = df[(df["Start"] == req.start) & (df["End"] == req.end)]
    if routes.empty:
        raise HTTPException(404, f"No route data for {req.start} → {req.end}")

    best = routes.loc[routes["Time_Minutes"].idxmin()]
    checkpoints = [c.strip() for c in str(best["Checkpoints"]).split(",")]

    features = np.array([[
        float(best["Distance_km"]),
        req.traffic,
        req.base_time,
        req.weather_impact
    ]])

    raw_pred = float(model.predict(features)[0])
    predicted_time = round(max(req.base_time, raw_pred), 2)

    # Naive confidence: based on how many training samples exist for this pair
    n_similar = len(routes)
    confidence = min(0.95, 0.70 + n_similar * 0.05)

    return PredictionResponse(
        predicted_time=predicted_time,
        distance_km=float(best["Distance_km"]),
        checkpoints=checkpoints,
        base_time=float(best["Base_Time"]),
        traffic_multiplier=req.traffic,
        weather_impact=req.weather_impact,
        confidence_pct=round(confidence * 100, 1)
    )


@app.get("/compare/{start}/{end}", response_model=list[RouteComparison])
async def compare_routes(start: str, end: str):
    """Return up to 3 route variants with different traffic assumptions."""
    if model is None or df is None:
        raise HTTPException(503, "ML service not ready")

    routes = df[(df["Start"] == start) & (df["End"] == end)]
    if routes.empty:
        raise HTTPException(404, f"No routes for {start} → {end}")

    best = routes.loc[routes["Time_Minutes"].idxmin()]
    dist = float(best["Distance_km"])
    base = float(best["Base_Time"])
    via  = str(best["Checkpoints"]).split(",")[0].strip()

    scenarios = [
        ("Light Traffic",  1.0,  via + " (Clear)"),
        ("Normal Traffic", 1.2,  via),
        ("Heavy Traffic",  1.45, via + " (Congested)"),
    ]

    results = []
    for label, traffic, via_label in scenarios:
        features = np.array([[dist, traffic, base, 1.0]])
        t = round(max(base, float(model.predict(features)[0])), 2)
        results.append(RouteComparison(
            label=label,
            predicted_time=t,
            distance_km=dist,
            via=via_label,
            traffic=traffic
        ))

    return results
