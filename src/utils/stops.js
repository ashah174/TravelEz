// Distinct colors so each day's pins are easy to tell apart on the map.
export const DAY_COLORS = [
  "#3d6140",
  "#c26a2e",
  "#3b6ea8",
  "#a23b72",
  "#6b4fa0",
  "#2a8282",
  "#a87d1e",
  "#7a4a33",
];

export function dayColor(dayIndex) {
  return DAY_COLORS[dayIndex % DAY_COLORS.length];
}

// Numbers every place across the trip in order:
// [{ number, dayIndex, name, lat, lng }]
export function getTripStops(days = []) {
  const stops = [];
  days.forEach((day, dayIndex) => {
    (day.places || []).forEach((place) => {
      if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
        stops.push({ number: stops.length + 1, dayIndex, ...place });
      }
    });
  });
  return stops;
}
