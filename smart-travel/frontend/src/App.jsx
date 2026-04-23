import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

import TopBar               from "./components/TopBar";
import Sidebar              from "./components/Sidebar";
import MapView              from "./components/MapView";
import PredictionCard       from "./components/PredictionCard";
import WeatherCard          from "./components/WeatherCard";
import SafetyTipsCard       from "./components/SafetyTipsCard";
import RouteComparisonChart from "./components/RouteComparisonChart";
import ErrorBanner          from "./components/ErrorBanner";
import { useTravel }        from "./hooks/useTravel";

const GRID_PATTERN =
  "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), " +
  "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)";

export default function App() {
  const [serviceStatus, setServiceStatus] = useState("idle");
  const [currentRoute,  setCurrentRoute]  = useState({ start: "", end: "" });

  const {
    cities, prediction, weather, safetyTips, comparison,
    loading, loadingTips, error,
    fetchCities, predict, reset,
  } = useTravel();

  // Boot — fetch cities and check service health
  useEffect(() => {
    fetchCities();
    axios.get("/api/health")
      .then(() => setServiceStatus("online"))
      .catch(() => setServiceStatus("error"));
  }, [fetchCities]);

  async function handlePredict(params) {
    setCurrentRoute({ start: params.start, end: params.end });
    await predict(params);
  }

  function handleReset() {
    setCurrentRoute({ start: "", end: "" });
    reset();
  }

  const hasPrediction = !!prediction;
  const hasCards = hasPrediction || loading;

  return (
    <div className="flex flex-col h-screen bg-navy-900 text-slate-200 overflow-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-100"
          style={{ backgroundImage: GRID_PATTERN, backgroundSize: "40px 40px" }}
        />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full
          bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full
          bg-gold-500/5 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10">
        <TopBar serviceStatus={serviceStatus} />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 relative z-10">

        {/* ── Left sidebar ───────────────────────────────────────────────── */}
        <div className="relative shrink-0 border-r border-white/[0.06] overflow-hidden">
          {/* Vertical separator glow */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b
            from-transparent via-gold-500/20 to-transparent pointer-events-none" />
          <Sidebar
            cities={cities}
            onPredict={handlePredict}
            onReset={handleReset}
            loading={loading}
            hasPrediction={hasPrediction}
          />
        </div>

        {/* ── Centre — Map ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col p-4 gap-4">
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <ErrorBanner message={error} onDismiss={handleReset} />
            )}
          </AnimatePresence>

          {/* Map takes full remaining height */}
          <div className="flex-1 min-h-0">
            <MapView
              prediction={prediction}
              start={currentRoute.start}
              end={currentRoute.end}
            />
          </div>
        </div>

        {/* ── Right panel — Result cards ──────────────────────────────────── */}
        <AnimatePresence>
          {hasCards && (
            <motion.div
              key="right-panel"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-[340px] shrink-0 border-l border-white/[0.06]
                overflow-y-auto overflow-x-hidden p-4 space-y-3"
            >
              {/* Loading skeleton for prediction card */}
              {loading && !prediction && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-5 space-y-4"
                >
                  <div className="h-4 shimmer rounded w-1/2" />
                  <div className="h-16 shimmer rounded-xl" />
                  <div className="grid grid-cols-2 gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-14 shimmer rounded-xl" />
                    ))}
                  </div>
                </motion.div>
              )}

              <PredictionCard
                prediction={prediction}
                start={currentRoute.start}
                end={currentRoute.end}
              />

              <WeatherCard
                weather={weather}
                city={currentRoute.start}
              />

              <SafetyTipsCard
                tips={safetyTips}
                loading={loadingTips}
              />

              <RouteComparisonChart
                comparison={comparison}
                start={currentRoute.start}
                end={currentRoute.end}
              />

              {/* Bottom padding */}
              <div className="h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty right placeholder (no prediction yet) ─────────────────── */}
        {!hasCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-[340px] shrink-0 border-l border-white/[0.06]
              flex flex-col items-center justify-center gap-3 p-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center mb-2">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="font-display font-semibold text-white text-sm">Awaiting Prediction</p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              Select a route and click Predict Route to see ML predictions, live weather &amp; AI safety tips.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
