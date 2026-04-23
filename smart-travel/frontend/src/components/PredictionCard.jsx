import { motion } from "framer-motion";
import { Clock, Ruler, Route, TrendingUp, CheckCircle2 } from "lucide-react";

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function StatBadge({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-card px-3.5 py-3 flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${accent}22` }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export default function PredictionCard({ prediction, start, end }) {
  if (!prediction) return null;

  const totalHours = prediction.predicted_time / 60;
  const speedKmh   = (prediction.distance_km / totalHours).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 tracking-wider uppercase mb-1">Predicted Journey</p>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="font-medium text-white">{start}</span>
            <span className="text-slate-600">→</span>
            <span className="font-medium text-white">{end}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10
          border border-emerald-400/20 rounded-full px-2.5 py-1">
          <CheckCircle2 size={11} />
          {prediction.confidence_pct ?? 87}% confidence
        </div>
      </div>

      {/* Big time display */}
      <div className="flex items-end justify-center gap-2 py-5 mb-4
        bg-gradient-to-b from-gold-500/5 to-transparent rounded-xl border border-gold-500/10">
        <div className="text-center">
          <motion.p
            key={prediction.predicted_time}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="font-display font-bold text-5xl text-gold-gradient leading-none"
          >
            {formatTime(prediction.predicted_time)}
          </motion.p>
          <p className="text-xs text-slate-500 mt-2">estimated travel time</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBadge
          icon={Ruler}
          label="Distance"
          value={`${prediction.distance_km?.toFixed(0)} km`}
          accent="#f59e0b"
        />
        <StatBadge
          icon={Clock}
          label="Base Time"
          value={formatTime(prediction.base_time)}
          accent="#3b82f6"
        />
        <StatBadge
          icon={TrendingUp}
          label="Avg Speed"
          value={`~${speedKmh} km/h`}
          accent="#8b5cf6"
        />
        <StatBadge
          icon={Route}
          label="Via"
          value={prediction.checkpoints?.[0] ?? "Direct"}
          accent="#22c55e"
        />
      </div>

      {/* Checkpoints strip */}
      {prediction.checkpoints && prediction.checkpoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-slate-500 mb-2 tracking-wider uppercase">Route Checkpoints</p>
          <div className="flex flex-wrap gap-1.5">
            {[start, ...prediction.checkpoints, end].map((stop, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border
                  ${i === 0 ? "border-gold-500/40 text-gold-400 bg-gold-500/10" :
                    i === arr.length - 1 ? "border-blue-500/40 text-blue-400 bg-blue-500/10" :
                    "border-white/10 text-slate-400 bg-white/5"}`}>
                  {stop}
                </span>
                {i < arr.length - 1 && <span className="text-slate-700 text-xs">›</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
