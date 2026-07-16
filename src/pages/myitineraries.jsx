import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Lock,
  Trash2,
  BookOpen,
  Pencil,
  ChevronDown,
  ChevronUp,
  Footprints,
  Utensils,
  Bus,
  BedDouble,
  NotebookPen,
} from "lucide-react";
import { useItineraries } from "../context/ItineraryContext";

function DaySchedule({ days }) {
  if (!days || days.length === 0) return null;

  return (
    <div className="day-schedule">
      {days.map((day, i) => {
        const hasContent =
          day.activities || day.restaurants || day.transit || day.hotel || day.other || day.notes;

        if (!hasContent) return null;

        return (
          <div key={i} className="schedule-day">
            <p className="schedule-day-title">Day {i + 1}</p>

            {day.activities && (
              <p>
                <Footprints size={13} /> <strong>Activities:</strong>{" "}
                {day.activities}
              </p>
            )}

            {day.restaurants && (
              <p>
                <Utensils size={13} /> <strong>Restaurants:</strong>{" "}
                {day.restaurants}
              </p>
            )}

            {day.transit && (
              <p>
                <Bus size={13} /> <strong>Transit:</strong> {day.transit}
              </p>
            )}

            {day.hotel && (
              <p>
                <BedDouble size={13} /> <strong>Hotel:</strong> {day.hotel}
              </p>
            )}

            {(day.other || day.notes) && (
              <p>
                <NotebookPen size={13} /> <strong>Notes:</strong>{" "}
                {day.other || day.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ItineraryCard({ trip, onTogglePrivacy, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  const tripId = trip._id || trip.id;

  const hasDays =
    trip.days &&
    trip.days.some(
      (d) =>
        d.activities ||
        d.restaurants ||
        d.transit ||
        d.hotel ||
        d.other ||
        d.notes
    );

  return (
    <div className="my-itinerary-card">
      <div className="my-card-image-wrap">
        <img src={trip.image} alt={trip.destination} />

        <span
          className={`privacy-badge ${
            trip.isPublic ? "badge-public" : "badge-private"
          }`}
        >
          {trip.isPublic ? (
            <>
              <Globe size={12} /> Public
            </>
          ) : (
            <>
              <Lock size={12} /> Private
            </>
          )}
        </span>
      </div>

      <div className="my-card-content">
        <h3>{trip.title}</h3>
        <p className="subtitle">{trip.destination}</p>

        <div className="my-card-meta">
          {trip.duration > 0 && (
            <span>
              {trip.duration} day{trip.duration !== 1 ? "s" : ""}
            </span>
          )}

          {trip.cost > 0 && <span>${trip.cost.toLocaleString()}</span>}
        </div>

        {trip.description && <p className="trip-desc">{trip.description}</p>}

        {hasDays && (
          <button
            className="view-schedule-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp size={14} /> Hide Schedule
              </>
            ) : (
              <>
                <ChevronDown size={14} /> View Schedule
              </>
            )}
          </button>
        )}

        {expanded && <DaySchedule days={trip.days} />}

        <div className="my-card-actions">
          <button
            className="edit-itinerary-btn"
            onClick={() => onEdit(tripId)}
          >
            <Pencil size={14} /> Edit
          </button>

          <button
            className={`privacy-toggle-btn ${
              trip.isPublic ? "btn-make-private" : "btn-make-public"
            }`}
            onClick={() => onTogglePrivacy(tripId)}
          >
            {trip.isPublic ? (
              <>
                <Lock size={14} /> Make Private
              </>
            ) : (
              <>
                <Globe size={14} /> Share Publicly
              </>
            )}
          </button>

          <button className="delete-btn" onClick={() => onDelete(tripId)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MyItineraries() {
  const { myItineraries, togglePrivacy, deleteItinerary } = useItineraries();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="my-itineraries-header">
        <div>
          <h1>My Itineraries</h1>
          <p className="subtitle">
            {myItineraries.length} itinerar
            {myItineraries.length === 1 ? "y" : "ies"} saved
          </p>
        </div>

        <Link to="/create" className="create-new-btn">
          + Create New
        </Link>
      </div>

      {myItineraries.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1.2} />
          <h2>No itineraries yet</h2>
          <p>Create your first itinerary and it will appear here.</p>

          <Link to="/create" className="submit-itinerary-btn empty-create-btn">
            Create Itinerary
          </Link>
        </div>
      ) : (
        <div className="my-itineraries-grid">
          {myItineraries.map((trip) => (
            <ItineraryCard
              key={trip._id || trip.id}
              trip={trip}
              onTogglePrivacy={togglePrivacy}
              onDelete={deleteItinerary}
              onEdit={(id) => navigate(`/edit-itinerary/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyItineraries;