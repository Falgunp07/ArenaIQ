import { useMemo } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { MapPinned, TriangleAlert } from "lucide-react";
import DeckGlOverlay from "./DeckGlOverlay";
import useRealtimeCrowd from "../hooks/useRealtimeCrowd";

const STADIUM_CENTER = { lat: 37.4035, lng: -121.9693 };
const DEFAULT_ZOOM = 17;

const COLOR_RANGE = [
  [16, 185, 129, 80],   // green — low density
  [16, 185, 129, 140],
  [245, 158, 11, 160],  // yellow/orange — medium
  [245, 158, 11, 200],
  [239, 68, 68, 200],   // red — high
  [239, 68, 68, 255],
];

function seedValue(seedText) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }

  const pseudo = Math.sin(hash) * 10000;
  return pseudo - Math.floor(pseudo);
}

export default function CrowdHeatmap({ compact = false }) {
  const { zones, loading } = useRealtimeCrowd();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  const heatmapData = useMemo(() => {
    if (!zones.length) return [];

    const points = [];
    for (const zone of zones) {
      if (!zone.lat || !zone.lng) continue;

      const count = Math.max(1, Math.round(zone.density / 10));
      for (let i = 0; i < count; i += 1) {
        // Reduced jitter to keep spots within zone boundaries
        const jitterLat = (Math.random() - 0.5) * 0.00015;
        const jitterLng = (Math.random() - 0.5) * 0.00015;
        points.push({
          lat: zone.lat + jitterLat,
          lng: zone.lng + jitterLng,
          weight: 1,
        });
      }
    }

    return points;
  }, [zones]);

  const layers = useMemo(() => {
    if (!heatmapData.length) return [];

    return [
      new HeatmapLayer({
        id: "crowd-heatmap",
        data: heatmapData,
        getPosition: (d) => [d.lng, d.lat],
        getWeight: (d) => d.weight,
        aggregation: "SUM",
        radiusPixels: compact ? 20 : 35,
        intensity: 3.5,
        threshold: 0.1,
        colorDomain: [0, 8],
        colorRange: COLOR_RANGE,
      }),
    ];
  }, [compact, heatmapData]);

  if (!apiKey) {
    return (
      <div className={`flex h-full items-center justify-center p-5 ${compact ? "min-h-56" : "min-h-[380px]"}`}>
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-amber/15 text-accent-amber">
            <TriangleAlert className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Map Key Missing</h3>
          <p className="mt-1 text-sm text-slate-600">
            Add <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to enable live heatmap rendering.
          </p>

          {zones.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <MapPinned className="h-3.5 w-3.5 text-accent-blue" />
                  <span className="truncate text-slate-600">{zone.name}</span>
                  <span className="ml-auto font-mono text-slate-900">{zone.density}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full overflow-hidden ${compact ? "min-h-56" : "min-h-[380px]"}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <div className="shimmer h-full w-full" />
        </div>
      )}

      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={STADIUM_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId={mapId}
          gestureHandling="cooperative"
          disableDefaultUI={compact}
          style={{ width: "100%", height: "100%" }}
          colorScheme="DARK"
        >
          {layers.length > 0 && <DeckGlOverlay layers={layers} />}
        </Map>
      </APIProvider>

      {!compact && (
        <div className="absolute bottom-6 mx-auto left-0 right-0 w-80 max-w-full rounded-2xl border border-slate-200/60 bg-white/90 px-5 py-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Density Sensor</p>
            <p className="text-[10px] text-slate-400 tracking-wider">Low &rarr; Max</p>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        </div>
      )}
    </div>
  );
}
