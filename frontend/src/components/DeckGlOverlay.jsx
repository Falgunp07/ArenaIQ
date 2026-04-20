/**
 * DeckGlOverlay.jsx — deck.gl ↔ Google Maps bridge component
 *
 * Connects a deck.gl GoogleMapsOverlay to the Google Map instance
 * provided by @vis.gl/react-google-maps. Accepts layers as a prop
 * and handles lifecycle cleanup.
 */

import { useEffect, useMemo } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";

export default function DeckGlOverlay({ layers }) {
  const map = useMap();

  // Create overlay once
  const deck = useMemo(
    () =>
      new GoogleMapsOverlay({
        layers: [],
      }),
    []
  );

  // Update layers when prop changes
  useEffect(() => {
    deck.setProps({ layers });
  }, [deck, layers]);

  // Bind overlay to map
  useEffect(() => {
    if (map) {
      deck.setMap(map);
    }
    return () => deck.setMap(null);
  }, [deck, map]);

  return null;
}
