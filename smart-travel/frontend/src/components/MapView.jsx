import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import L from "leaflet";
import { CITY_COORDS } from "../utils/constants";

// Fix default icon issue in Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom gold marker for origin
const goldIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:linear-gradient(135deg,#f59e0b,#d97706);
    border:2px solid #fff;
    box-shadow:0 0 12px rgba(245,158,11,0.8), 0 2px 6px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Blue marker for destination
const blueIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:linear-gradient(135deg,#3b82f6,#1d4ed8);
    border:2px solid #fff;
    box-shadow:0 0 12px rgba(59,130,246,0.8), 0 2px 6px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Grey checkpoint marker
const checkpointIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:10px;height:10px;border-radius:50%;
    background:rgba(148,163,184,0.9);
    border:1.5px solid rgba(255,255,255,0.5);
    box-shadow:0 1px 4px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Fly to bounds when route changes
function MapFlyTo({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
    }
  }, [positions, map]);
  return null;
}

// ── Empty state overlay ──────────────────────────────────────────────────────
function EmptyOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[1000] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card px-8 py-6 text-center max-w-xs"
      >
        <div className="w-14 h-14 rounded-2xl bg-gold-gradient mx-auto mb-3 flex items-center justify-center shadow-glow-gold">
          <Map size={24} className="text-navy-900" />
        </div>
        <h3 className="font-display font-semibold text-white mb-1.5">India Route Map</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Select origin &amp; destination, then click <span className="text-gold-400 font-medium">Predict Route</span> to visualize.
        </p>
      </motion.div>
    </div>
  );
}

// ── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView({ prediction, start, end }) {
  const hasRoute = prediction && start && end;

  // Build route coordinates from start → checkpoints → end
  const routeCoords = [];
  if (hasRoute) {
    if (CITY_COORDS[start])   routeCoords.push(CITY_COORDS[start]);
    if (prediction.checkpoints) {
      prediction.checkpoints.forEach(cp => {
        if (CITY_COORDS[cp]) routeCoords.push(CITY_COORDS[cp]);
      });
    }
    if (CITY_COORDS[end]) routeCoords.push(CITY_COORDS[end]);
  }

  const center = [20.5937, 78.9629]; // India centre

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.06]">
      <MapContainer
        center={center}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {hasRoute && routeCoords.length > 0 && (
          <>
            {/* Main route polyline */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: "#f59e0b",
                weight: 3.5,
                opacity: 0.85,
                dashArray: undefined,
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            {/* Glow layer */}
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: "#fbbf24",
                weight: 8,
                opacity: 0.18,
                lineCap: "round",
              }}
            />

            {/* Origin marker */}
            {CITY_COORDS[start] && (
              <Marker position={CITY_COORDS[start]} icon={goldIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-white">{start}</p>
                    <p className="text-xs text-slate-400">Origin</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Checkpoint markers */}
            {prediction.checkpoints?.map((cp, i) =>
              CITY_COORDS[cp] ? (
                <Marker key={i} position={CITY_COORDS[cp]} icon={checkpointIcon}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold text-white">{cp}</p>
                      <p className="text-xs text-slate-400">Checkpoint {i + 1}</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Destination marker */}
            {CITY_COORDS[end] && (
              <Marker position={CITY_COORDS[end]} icon={blueIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-white">{end}</p>
                    <p className="text-xs text-slate-400">Destination</p>
                  </div>
                </Popup>
              </Marker>
            )}

            <MapFlyTo positions={routeCoords} />
          </>
        )}
      </MapContainer>

      {!hasRoute && <EmptyOverlay />}

      {/* Top overlay badge */}
      {hasRoute && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 left-3 z-[1000] glass-card px-3 py-1.5 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">
            {start} → {prediction.checkpoints?.[0]} → {end}
          </span>
        </motion.div>
      )}
    </div>
  );
}
