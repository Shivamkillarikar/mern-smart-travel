import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ErrorBanner({ message, onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          className="flex items-start gap-3 p-4 rounded-xl
            border border-red-500/30 bg-red-500/10 text-red-300"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
          <p className="text-sm flex-1 leading-relaxed">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
