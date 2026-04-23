import { motion } from "framer-motion";
import { Thermometer, Wind, Droplets, Cloud } from "lucide-react";
import { WEATHER_ICONS } from "../utils/constants";

function WeatherStat({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 glass-card rounded-xl">
      <Icon size={16} style={{ color }} />
      <p className="text-lg font-semibold text-white leading-none">{value}<span className="text-xs text-slate-400 ml-0.5">{unit}</span></p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function ImpactBar({ impact }) {
  // impact is 0.8 – 1.2; map to a 0–100 score (bad = low)
  const score    = Math.round(((1.2 - impact) / 0.4) * 100);
  const label    = impact <= 0.95 ? "Excellent" : impact <= 1.05 ? "Good" : impact <= 1.12 ? "Fair" : "Poor";
  const color    = impact <= 0.95 ? "#22c55e" : impact <= 1.05 ? "#84cc16" : impact <= 1.12 ? "#f59e0b" : "#ef4444";
  const barPct   = (1 - (impact - 0.8) / 0.4) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">Weather Impact</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {label} ({impact?.toFixed(2)}×)
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {impact > 1 ? `+${((impact - 1) * 100).toFixed(0)}% longer travel time due to conditions`
                    : `Journey conditions are favourable`}
      </p>
    </div>
  );
}

export default function WeatherCard({ weather, city }) {
  if (!weather) return null;

  const conditionKey = weather.description?.split(" ").pop().toLowerCase() || "clouds";
  const emoji        = WEATHER_ICONS[conditionKey] ?? "🌤️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 tracking-wider uppercase mb-1">Live Weather</p>
          <p className="text-sm font-medium text-white">{city}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl leading-none">{emoji}</span>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{weather.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <WeatherStat
          icon={Thermometer}
          label="Temp"
          value={weather.temp?.toFixed(1) ?? "—"}
          unit="°C"
          color="#f59e0b"
        />
        <WeatherStat
          icon={Wind}
          label="Wind"
          value={weather.windSpeed?.toFixed(1) ?? "—"}
          unit="m/s"
          color="#3b82f6"
        />
        <WeatherStat
          icon={Droplets}
          label="Humidity"
          value={weather.humidity ?? "—"}
          unit="%"
          color="#22d3ee"
        />
      </div>

      {weather.rain > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs text-blue-300 bg-blue-500/10
          border border-blue-500/20 rounded-lg px-3 py-2">
          🌧️ Rainfall: {weather.rain?.toFixed(1)} mm/h detected
        </div>
      )}

      {/* Impact bar */}
      {weather.weatherImpact != null && (
        <ImpactBar impact={weather.weatherImpact} />
      )}
    </motion.div>
  );
}
