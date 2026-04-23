import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../utils/constants";

const api = axios.create({ baseURL: API_BASE });

export function useTravel() {
  const [cities, setCities]               = useState([]);
  const [prediction, setPrediction]       = useState(null);
  const [weather, setWeather]             = useState(null);
  const [safetyTips, setSafetyTips]       = useState([]);
  const [comparison, setComparison]       = useState([]);
  const [loading, setLoading]             = useState(false);
  const [loadingTips, setLoadingTips]     = useState(false);
  const [error, setError]                 = useState(null);

  // ── Load available cities ────────────────────────────────────────────────
  const fetchCities = useCallback(async () => {
    try {
      const { data } = await api.get("/cities");
      setCities(data.cities || []);
    } catch {
      // Fallback to hardcoded list if backend unavailable
      setCities([
        "Ahmedabad", "Bangalore", "Bhopal", "Chennai", "Delhi",
        "Ghaziabad", "Hyderabad", "Indore", "Jaipur", "Kanpur",
        "Kolkata", "Lucknow", "Mumbai", "Nagpur", "Patna",
        "Surat", "Thane", "Vadodara", "Visakhapatnam",
      ]);
    }
  }, []);

  // ── Run full prediction flow ─────────────────────────────────────────────
  const predict = useCallback(async ({ start, end, traffic, baseTime }) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    setWeather(null);
    setSafetyTips([]);
    setComparison([]);

    try {
      // 1. Main prediction (backend also fetches weather internally)
      const { data: pred } = await api.post("/predict", {
        start,
        end,
        traffic,
        base_time: baseTime,
      });
      setPrediction(pred);

      if (pred.weather) {
        setWeather(pred.weather);

        // 2. Safety tips from Gemini
        setLoadingTips(true);
        const { data: tips } = await api.post("/safety-tips", {
          temp:       pred.weather.temp,
          windSpeed:  pred.weather.windSpeed,
          rain:       pred.weather.rain,
          route:      `${start} → ${end}`,
        });
        setSafetyTips(tips.tips || []);
        setLoadingTips(false);
      }

      // 3. Route comparison chart
      const { data: comp } = await api.get(`/compare/${encodeURIComponent(start)}/${encodeURIComponent(end)}`);
      setComparison(Array.isArray(comp) ? comp : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to get prediction. Check that all services are running.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPrediction(null);
    setWeather(null);
    setSafetyTips([]);
    setComparison([]);
    setError(null);
  }, []);

  return {
    cities,
    prediction,
    weather,
    safetyTips,
    comparison,
    loading,
    loadingTips,
    error,
    fetchCities,
    predict,
    reset,
  };
}
