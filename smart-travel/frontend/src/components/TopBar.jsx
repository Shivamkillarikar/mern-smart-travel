import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Wifi, WifiOff, Navigation2 } from "lucide-react";

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs text-slate-400 tabular-nums">
      {time.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}
    </span>
  );
}

export default function TopBar({ serviceStatus }) {
  const isOnline = serviceStatus !== "error";

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-14 shrink-0 flex items-center justify-between px-6
        border-b border-white/[0.06] bg-navy-900/80 backdrop-blur-xl z-20"
    >
      {/* Left — brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gold-gradient flex items-center justify-center">
            <Navigation2 size={13} className="text-navy-900" />
          </div>
          <span className="font-display font-bold text-white text-sm tracking-tight">
            Smart<span className="text-gold-400">Travel</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 h-5 pl-3 border-l border-white/10">
          <span className="text-xs text-slate-500">AI Route Intelligence</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">India</span>
        </div>
      </div>

      {/* Right — status + clock */}
      <div className="flex items-center gap-4">
        <div className={`hidden sm:flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border
          ${isOnline
            ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/8"
            : "text-red-400 border-red-400/20 bg-red-400/8"}`}
        >
          {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span>{isOnline ? "ML Service Online" : "ML Service Offline"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Activity size={12} className="text-gold-500 animate-pulse-slow" />
          <LiveClock />
        </div>
      </div>
    </motion.header>
  );
}
