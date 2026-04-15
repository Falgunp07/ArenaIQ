/**
 * CrowdHeatmap.jsx — Google Maps with deck.gl heatmap overlay
 *
 * Displays the venue on Google Maps with a real-time heat overlay
 * driven by Firestore zone density data. Uses @vis.gl/react-google-maps
 * for the map and deck.gl HeatmapLayer for the visualisation.
 */

import { useMemo } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import DeckGlOverlay from "./DeckGlOverlay";
import useRealtimeCrowd from "../hooks/useRealtimeCrowd";

// Stadium centre coordinates (fictional, San Jose area)
const STADIUM_CENTER = { lat: 37.4035, lng: -121.9693 };
const DEFAULT_ZOOM = 17;

// Density-to-colour gradient: green → amber → red
const COLOR_RANGE = [
  [16, 185, 129, 80],   // green — low density
  [16, 185, 129, 140],
  [245, 158, 11, 160],  // amber — medium
  [245, 158, 11, 200],
  [239, 68, 68, 200],   // red — high
  [239, 68, 68, 255],
];

export default function CrowdHeatmap({ compact = false }) {
  const { zones, loading } = useRealtimeCrowd();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

  // Transform zone data for the heatmap layer
  // Each zone generates multiple data points spread around its lat/lng
  // for a more realistic heatmap appearance
  const heatmapData = useMemo(() => {
    if (!zones.length) return [];

    const points = [];
    for (const zone of zones) {
      if (!zone.lat || !zone.lng) continue;

      // Generate spread points around zone center based on density
      const count = Math.max(1, Math.round(zone.density / 10));
      for (let i = 0; i < count; i++) {
        const jitterLat = (Math.random() - 0.5) * 0.0008;
        const jitterLng = (Math.random() - 0.5) * 0.0008;
        points.push({
          lat: zone.lat + jitterLat,
          lng: zone.lng + jitterLng,
          weight: zone.density / 100,
        });
      }
    }
    return points;
  }, [zones]);

  // deck.gl HeatmapLayer
  const layers = useMemo(
    () => [
      new HeatmapLayer({
        id: "crowd-heatmap",
        data: heatmapData,
        getPosition: (d) => [d.lng, d.lat],
        getWeight: (d) => d.weight,
        aggregation: "SUM",
        radiusPixels: compact ? 30 : 50,
        intensity: 1.5,
        threshold: 0.05,
        colorRange: COLOR_RANGE,
      }),
    ],
    [heatmapData, compact]
  );

  // Fallback when no API key
  if (!apiKey) {
    return (
      <div className={`glass-card flex items-center justify-center ${compact ? "h-64" : "h-full min-h-[400px]"}`}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="text-text-primary font-semibold mb-1">Map Unavailable</h3>
          <p className="text-text-secondary text-sm">
            Set <code className="text-accent-cyan font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to enable the live heatmap.
          </p>
          {/* Show zone data as text fallback */}
          {zones.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        z.density < 50
                          ? "var(--color-accent-green)"
                          : z.density < 80
                          ? "var(--color-accent-amber)"
                          : "var(--color-accent-red)",
                    }}
                  />
                  <span className="text-text-secondary">{z.name}</span>
                  <span className="font-mono text-text-primary ml-auto">{z.density}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden relative ${compact ? "h-64" : "h-full min-h-[400px]"}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stadium-dark/80">
          <div className="shimmer w-full h-full rounded-xl" />
        </div>
      )}

      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={STADIUM_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId={mapId}
          gestureHandling="cooperative"
          disableDefaultUI={compact}
          style={{ width: "100%", height: "100%", borderRadius: "16px" }}
          colorScheme="DARK"
        >
          <DeckGlOverlay layers={layers} />
        </Map>
      </APIProvider>

      {/* Legend */}
      {!compact && (
        <div className="absolute bottom-4 left-4 glass-card px-3 py-2">
          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">
            Density
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-secondary">Low</span>
            <div
              className="h-2 w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, #10b981, #f59e0b, #ef4444)",
              }}
            />
            <span className="text-[10px] text-text-secondary">High</span>
          </div>
        </div>
      )}
    </div>
  );
}
