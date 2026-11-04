import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, MapPin, Plus, X } from "lucide-react";
import { geocodePlace } from "../services/api";

export const MAX_DAY_PLACES = 8;

// Edits the ordered list of places for one day. Each place is looked up on
// the map when added, so it can be pinned on the detail page.
function DayPlacesEditor({ places, onChange, near }) {
  const [draft, setDraft] = useState("");
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");

  const addPlace = async () => {
    const name = draft.trim();
    if (!name || looking) return;

    setLooking(true);
    setError("");

    try {
      const response = await geocodePlace(name, near);
      onChange([...places, { name, lat: response.data.lat, lng: response.data.lng }]);
      setDraft("");
    } catch (lookupError) {
      setError(
        lookupError.response?.status === 401
          ? "Sign in to add places."
          : lookupError.response?.data?.message || "Couldn't look up that place."
      );
    } finally {
      setLooking(false);
    }
  };

  const move = (index, offset) => {
    const next = [...places];
    const [item] = next.splice(index, 1);
    next.splice(index + offset, 0, item);
    onChange(next);
  };

  return (
    <div className="day-places-editor">
      {places.length > 0 && (
        <ol className="day-place-list">
          {places.map((place, index) => (
            <li key={`${place.name}-${index}`}>
              <span className="day-place-name">{place.name}</span>
              <span className="day-place-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${place.name} up`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={index === places.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${place.name} down`}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(places.filter((_, i) => i !== index))}
                  aria-label={`Remove ${place.name}`}
                >
                  <X size={14} />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {places.length < MAX_DAY_PLACES && (
        <div className="inline-add">
          <MapPin size={16} className="inline-add-icon" />
          <input
            type="text"
            placeholder="Add a place, e.g. Louvre Museum"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlace();
              }
            }}
          />
          <button type="button" onClick={addPlace} disabled={looking} aria-label="Add place">
            {looking ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default DayPlacesEditor;
