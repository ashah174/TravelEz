import { useEffect } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { dayColor } from "../utils/stops";

function numberedIcon(number, color) {
  return L.divIcon({
    className: "map-pin",
    html: `<span style="background:${color}">${Number(number)}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -14],
  });
}

function FitToStops({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);

  useEffect(() => {
    const latLngs = JSON.parse(key);
    if (latLngs.length > 1) map.fitBounds(latLngs, { padding: [36, 36], maxZoom: 15 });
    else if (latLngs.length === 1) map.setView(latLngs[0], 14);
  }, [map, key]);

  return null;
}

// Map of a trip. Shows numbered, color-by-day pins joined by a route line when
// the trip has places; otherwise a single pin on the destination.
// Loaded lazily so Leaflet isn't in the main bundle.
function TripMap({ location, title, stops = [] }) {
  const hasStops = stops.length > 0;
  const center = hasStops ? [stops[0].lat, stops[0].lng] : [location.lat, location.lng];
  const points = stops.map((stop) => [stop.lat, stop.lng]);

  return (
    <div className="trip-map">
      <MapContainer center={center} zoom={11} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasStops ? (
          <>
            <FitToStops points={points} />
            {points.length > 1 && (
              <Polyline
                positions={points}
                pathOptions={{ color: "var(--accent)", weight: 3, opacity: 0.7, dashArray: "6 8" }}
              />
            )}
            {stops.map((stop) => (
              <Marker
                key={stop.number}
                position={[stop.lat, stop.lng]}
                icon={numberedIcon(stop.number, dayColor(stop.dayIndex))}
              >
                <Tooltip direction="top">
                  Day {stop.dayIndex + 1}: {stop.name}
                </Tooltip>
              </Marker>
            ))}
          </>
        ) : (
          <CircleMarker
            center={center}
            radius={11}
            pathOptions={{ color: "var(--accent-hover)", fillColor: "var(--accent)", fillOpacity: 0.85, weight: 3 }}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent>
              {title}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}

export default TripMap;
