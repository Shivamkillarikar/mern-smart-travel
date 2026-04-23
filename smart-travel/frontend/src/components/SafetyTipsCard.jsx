import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, AlertTriangle } from "lucide-react";

const TIP_COLORS = [
  { border: "border-gold-500/30",   bg: "bg-gold-500/8",   icon: "text-gold-400"   },
  { border: "border-blue-500/30",   bg: "bg-blue-500/8",   icon: "text-blue-400"   },
  { border: "border-purple-500/30", bg: "bg-purple-500/8", icon: "text-purple-400" },
];

function SkeletonTip({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex items-start gap-3 p-3 rounded-xl border border-white/5"
    >
      <div className="w-7 h-7 rounded-lg shimmer shrink-0" />
      <div className="flex-1 space-y-1.5 pt-0.5">
        <div className="h-3 rounded shimmer w-full" />
        <div className="h-3 rounded shimmer w-4/5" />
      </div>
    </motion.div>
  );
}

export default function SafetyTipsCard({ tips, loading }) {
  const hasTips = tips && tips.length > 0;

  if (!loading && !hasTips) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <Sparkles size={15} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">AI Safety Tips</p>
          <p className="text-xs text-slate-500 mt-0.5">Gemini-powered recommendations</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" className="space-y-2.5">
              <SkeletonTip delay={0} />
              <SkeletonTip delay={0.1} />
              <SkeletonTip delay={0.2} />
            </motion.div>
          ) : (
            <motion.div key="tips" className="space-y-2.5">
              {tips.map((tip, i) => {
                const style = TIP_COLORS[i % TIP_COLORS.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.border} ${style.bg}`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${style.bg} border ${style.border}`}>
                      <Shield size={12} className={style.icon} />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!loading && hasTips && (
        <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
          <AlertTriangle size={10} />
          AI-generated tips — use your own judgment
        </p>
      )}
    </motion.div>
  );
}
