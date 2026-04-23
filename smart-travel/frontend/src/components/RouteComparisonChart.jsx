import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { BarChart2 } from "lucide-react";

const SCENARIO_COLORS = {
  "Light Traffic":  "#22c55e",
  "Normal Traffic": "#f59e0b",
  "Heavy Traffic":  "#ef4444",
};

function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-4 py-3 border border-white/15 text-sm">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-slate-400">
        Time: <span className="text-white font-medium">{formatMinutes(d.predicted_time)}</span>
      </p>
      <p className="text-slate-400">
        Distance: <span className="text-white font-medium">{d.distance_km} km</span>
      </p>
      <p className="text-slate-400">
        Via: <span className="text-slate-300">{d.via}</span>
      </p>
      <p className="text-slate-400">
        Traffic: <span className="text-white font-medium">{d.traffic}×</span>
      </p>
    </div>
  );
}

export default function RouteComparisonChart({ comparison, start, end }) {
  if (!comparison || comparison.length === 0) return null;

  const baseline = comparison[0]?.predicted_time ?? 0;

  const chartData = comparison.map(c => ({
    ...c,
    label: c.label.replace(" Traffic", ""),
    color: SCENARIO_COLORS[c.label] ?? "#94a3b8",
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <BarChart2 size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Route Comparison</p>
          <p className="text-xs text-slate-500 mt-0.5">Traffic scenario analysis</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {comparison.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SCENARIO_COLORS[c.label] ?? "#94a3b8" }} />
            <span className="text-xs text-slate-400">{c.label.replace(" Traffic", "")}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            barSize={40}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${Math.floor(v / 60)}h`}
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)", radius: 8 }}
            />
            <ReferenceLine
              y={baseline}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
              label={{ value: "Base", position: "right", fill: "#64748b", fontSize: 10 }}
            />
            <Bar dataKey="predicted_time" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delta badges */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
        {comparison.map((c, i) => {
          const delta = c.predicted_time - baseline;
          return (
            <div key={i} className="text-center">
              <p className="text-xs text-slate-500 truncate">{c.label.replace(" Traffic", "")}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: SCENARIO_COLORS[c.label] }}>
                {formatMinutes(c.predicted_time)}
              </p>
              {i > 0 && (
                <p className="text-xs text-slate-600">+{formatMinutes(delta)}</p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
