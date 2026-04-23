import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, Zap, RotateCcw, ChevronDown,
  Gauge, Clock, ArrowRight, Search,
} from "lucide-react";
import { TRAFFIC_OPTIONS } from "../utils/constants";

// ── City autocomplete dropdown ───────────────────────────────────────────────
function CitySelect({ label, value, onChange, cities, icon: Icon, placeholder, exclude }) {
  const [query, setQuery]       = useState(value || "");
  const [open, setOpen]         = useState(false);
  const [focused, setFocused]   = useState(false);
  const ref                     = useRef(null);

  const filtered = cities
    .filter(c => c !== exclude && c.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keep input in sync when value cleared externally
  useEffect(() => { if (!value) setQuery(""); }, [value]);

  function select(city) {
    setQuery(city);
    onChange(city);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wider uppercase">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 dark-input px-3 py-2.5 cursor-text
          ${focused ? "border-gold-500/50 shadow-[0_0_0_3px_rgba(245,158,11,0.1)]" : ""}`}
        onClick={() => { setOpen(true); setFocused(true); }}
      >
        <Icon size={15} className="text-gold-500 shrink-0" />
        <input
          className="bg-transparent flex-1 text-sm text-slate-200 placeholder-slate-500 outline-none"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
          onFocus={() => { setOpen(true); setFocused(true); }}
          onBlur={() => setFocused(false)}
        />
        <Search size={13} className="text-slate-600" />
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1.5 w-full glass-card border border-white/10 overflow-hidden shadow-2xl"
          >
            {filtered.map(city => (
              <li
                key={city}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300
                  hover:bg-white/8 hover:text-gold-400 cursor-pointer transition-colors"
                onMouseDown={() => select(city)}
              >
                <MapPin size={12} className="text-slate-500" />
                {city}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Traffic slider ───────────────────────────────────────────────────────────
function TrafficSlider({ value, onChange }) {
  const idx     = TRAFFIC_OPTIONS.findIndex(o => o.value === value) ?? 2;
  const current = TRAFFIC_OPTIONS[idx] || TRAFFIC_OPTIONS[2];

  return (
    <div>
      <label className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">Traffic Level</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: current.color, background: `${current.color}22` }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: current.color }} />
          {current.label}
        </span>
      </label>

      <input
        type="range"
        min={0} max={TRAFFIC_OPTIONS.length - 1} step={1}
        value={idx}
        onChange={e => onChange(TRAFFIC_OPTIONS[+e.target.value].value)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${current.color} 0%, ${current.color} ${(idx / (TRAFFIC_OPTIONS.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(idx / (TRAFFIC_OPTIONS.length - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />

      <div className="flex justify-between mt-1.5">
        {TRAFFIC_OPTIONS.map((o, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full"
            style={{ background: i <= idx ? current.color : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1">{current.desc}</p>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ cities, onPredict, onReset, loading, hasPrediction }) {
  const [start,     setStart]     = useState("");
  const [end,       setEnd]       = useState("");
  const [traffic,   setTraffic]   = useState(1.2);
  const [baseTime,  setBaseTime]  = useState(60);

  function handleSubmit() {
    if (start && end && start !== end) {
      onPredict({ start, end, traffic, baseTime });
    }
  }

  function handleReset() {
    setStart(""); setEnd(""); setTraffic(1.2); setBaseTime(60);
    onReset();
  }

  const canPredict = start && end && start !== end && !loading;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-[340px] shrink-0 h-full flex flex-col overflow-y-auto"
    >
      {/* Logo / brand */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-glow-gold">
            <Navigation size={18} className="text-navy-900" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white leading-none">SmartTravel</h1>
            <p className="text-xs text-slate-500 mt-0.5">Route Intelligence</p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5 flex-1">
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Origin & Destination */}
        <div className="glass-card p-4 space-y-4">
          <CitySelect
            label="Origin"
            value={start}
            onChange={setStart}
            cities={cities}
            icon={MapPin}
            placeholder="Select start city…"
            exclude={end}
          />

          {/* Swap arrow */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-white/5" />
            <button
              onClick={() => { setStart(end); setEnd(start); }}
              className="mx-3 w-7 h-7 rounded-full glass-card flex items-center justify-center
                text-slate-400 hover:text-gold-400 hover:border-gold-500/30 transition-all"
            >
              <ArrowRight size={12} />
            </button>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <CitySelect
            label="Destination"
            value={end}
            onChange={setEnd}
            cities={cities}
            icon={Navigation}
            placeholder="Select end city…"
            exclude={start}
          />
        </div>

        {/* Traffic + Base time */}
        <div className="glass-card p-4 space-y-5">
          <TrafficSlider value={traffic} onChange={setTraffic} />

          <div className="h-px bg-white/5" />

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wider uppercase">
              Base Travel Time
            </label>
            <div className="flex items-center gap-2 dark-input px-3 py-2.5">
              <Clock size={15} className="text-gold-500 shrink-0" />
              <input
                type="number"
                min={10}
                max={5000}
                value={baseTime}
                onChange={e => setBaseTime(+e.target.value)}
                className="bg-transparent flex-1 text-sm text-slate-200 outline-none w-full"
              />
              <span className="text-xs text-slate-500">min</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Ideal time without traffic / weather</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pb-6">
          <button
            onClick={handleSubmit}
            disabled={!canPredict}
            className="btn-predict w-full py-3.5 flex items-center justify-center gap-2.5 text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                Analyzing Route…
              </>
            ) : (
              <>
                <Zap size={16} />
                Predict Route
              </>
            )}
          </button>

          {hasPrediction && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleReset}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-slate-400
                hover:text-slate-200 glass-card glass-card-hover transition-all"
            >
              <RotateCcw size={13} />
              Reset
            </motion.button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
