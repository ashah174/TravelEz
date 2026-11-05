import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Lock,
  MapPin,
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
import { useAuth } from "../context/AuthContext";
import { DEFAULT_TRIP_IMAGE, optimizedImageUrl } from "../utils/images";

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
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = !!trip.image && trip.image !== DEFAULT_TRIP_IMAGE && !imageFailed;

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
    <article className="trip-card my-trip-card">
      <div className="trip-card-media">
        {hasImage ? (
          <img
            src={optimizedImageUrl(trip.image, 800)}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="trip-card-fallback">
            <MapPin size={28} />
            <span>{trip.destination}</span>
          </div>
        )}

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

      <div className="trip-card-details">
        <p className="trip-card-destination">{trip.destination}</p>
        <h3>
          <Link to={`/itinerary/${tripId}`} className="trip-card-link">
            {trip.title}
          </Link>
        </h3>

        <div className="trip-card-badges">
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
    </article>
  );
}

function MyItineraries() {
  const { myItineraries, togglePrivacy, deleteItinerary } = useItineraries();
  const navigate = useNavigate();
  const { user, authReady, signInWithGoogle } = useAuth();

  return (
    <div className="page">
      <header className="page-head page-head--row">
        <div>
          <h1>My Trips</h1>
          {user && (
            <p>
              {myItineraries.length} trip{myItineraries.length === 1 ? "" : "s"} saved
            </p>
          )}
        </div>

        {user && (
          <Link to="/create" className="create-new-btn">
            + Create New
          </Link>
        )}
      </header>

      {!authReady ? null : !user ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1.2} />
          <h2>Sign in to see your trips</h2>
          <p>Trips you create or copy will be saved here.</p>
          <button type="button" className="btn-signin" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        </div>
      ) : myItineraries.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1.2} />
          <h2>No trips yet</h2>
          <p>Create your first trip, or copy one you like, and it will appear here.</p>

          <Link to="/create" className="submit-itinerary-btn empty-create-btn">
            Create a trip
          </Link>
        </div>
      ) : (
        <div className="card-grid">
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
