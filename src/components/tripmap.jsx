import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Map of a trip's destination. Loaded lazily so Leaflet isn't in the main bundle.
function TripMap({ location, title }) {
  const position = [location.lat, location.lng];

  return (
    <div className="trip-map">
      <MapContainer center={position} zoom={11} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={position}
          radius={11}
          pathOptions={{ color: "#3d6140", fillColor: "#7a9e7e", fillOpacity: 0.85, weight: 3 }}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent>
            {title}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}

export default TripMap;
