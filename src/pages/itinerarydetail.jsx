import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Copy, Map as MapIcon, Star, Trash2 } from "lucide-react";
import {
  copyItinerary,
  getItineraryById,
  addCommentToItinerary,
  updateCommentOnItinerary,
  deleteCommentFromItinerary,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useItineraries } from "../context/ItineraryContext";
import { getAverageRating, formatRating } from "../utils/rating";
import { DEFAULT_TRIP_IMAGE, optimizedImageUrl } from "../utils/images";
import { dayColor, getTripStops } from "../utils/stops";
import { tagPath } from "../constants/tags";
import PhotoGallery from "../components/photogallery";

const TripMap = lazy(() => import("../components/tripmap"));

// Below this width the map is hidden behind a button and Copy sits in a bottom bar.
const STACKED_LAYOUT = "(max-width: 900px)";


function ItineraryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user, signInWithGoogle } = useAuth();
  const { deleteItinerary, addItinerary } = useItineraries();
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState("");

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newRating, setNewRating] = useState("");
  const [newComment, setNewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [editError, setEditError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editRating, setEditRating] = useState("");
  const [editComment, setEditComment] = useState("");

  const [heroFailed, setHeroFailed] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [isStacked, setIsStacked] = useState(() => window.matchMedia(STACKED_LAYOUT).matches);

  useEffect(() => {
    const query = window.matchMedia(STACKED_LAYOUT);
    const handleChange = (e) => setIsStacked(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // Reloads once sign-in resolves: what the viewer may see depends on who they
  // are (their private trips, the "Inspired by" credit).
  const viewerUid = user?.uid;

  useEffect(() => {
    let ignore = false;

    const loadItinerary = async () => {
      try {
        const response = await getItineraryById(id);
        if (!ignore) setItinerary(response.data);
      } catch (error) {
        console.error("Error loading itinerary:", error);
        if (!ignore) setItinerary(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadItinerary();

    return () => {
      ignore = true;
    };
  }, [id, viewerUid]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    const ratingValue = Number(newRating);

    if (!newComment.trim() || ratingValue < 1 || ratingValue > 5) return;

    const commentData = {
      rating: ratingValue,
      text: newComment.trim(),
      username: user?.displayName || "Anonymous",
    };

    setSubmittingReview(true);
    setReviewError("");

    try {
      const response = await addCommentToItinerary(id, commentData);
      setItinerary(response.data);
      setNewRating("");
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setReviewError(
        error.response?.data?.message || "Couldn't post your review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id || comment.id);
    setEditRating(String(comment.rating));
    setEditComment(comment.text);
    setEditError("");
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditRating("");
    setEditComment("");
  };

  const handleUpdateComment = async (commentId) => {
    const ratingValue = Number(editRating);

    if (!editComment.trim() || ratingValue < 1 || ratingValue > 5) return;

    const updatedCommentData = {
      rating: ratingValue,
      text: editComment.trim(),
    };

    try {
      const response = await updateCommentOnItinerary(
        id,
        commentId,
        updatedCommentData
      );
      setItinerary(response.data);
      cancelEditingComment();
    } catch (error) {
      console.error("Error updating comment:", error);
      setEditError(
        error.response?.data?.message || "Couldn't save your review. Please try again."
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await deleteCommentFromItinerary(id, commentId);
      setItinerary(response.data);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading || !itinerary) {
    return (
      <div className="trip-page">
        <header className="trip-hero">
          <div className="trip-hero-inner">
            <h1>{loading ? "Loading..." : "Trip not found"}</h1>
          </div>
        </header>
      </div>
    );
  }

  const comments = itinerary.comments || [];

  const averageRating = formatRating(getAverageRating(itinerary));

  const duration = itinerary.duration || itinerary.days?.length || 0;
  const hasCover =
    !!itinerary.image && itinerary.image !== DEFAULT_TRIP_IMAGE && !heroFailed;

  const isOwner = !!user && user.uid === itinerary.ownerUid;
  const hasReviewed =
    !!user && comments.some((comment) => comment.ownerUid === user.uid);
  const author = itinerary.author;
  const hasLocation =
    Number.isFinite(itinerary.location?.lat) && Number.isFinite(itinerary.location?.lng);
  const stops = getTripStops(itinerary.days);
  const inspiredBy = itinerary.inspiredBy;
  const copyCount = itinerary.copyCount || 0;

  const handleCopy = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch {
        return;
      }
    }

    setCopying(true);
    setCopyError("");

    try {
      const response = await copyItinerary(id);
      addItinerary(response.data);
      navigate(`/edit-itinerary/${response.data._id}`);
    } catch (error) {
      console.error("Error copying itinerary:", error);
      setCopyError("Couldn't copy this trip. Please try again.");
      setCopying(false);
    }
  };

  const handleAdminDelete = () => {
    deleteItinerary(id);
    navigate("/");
  };

  const credits = (
    <div className="trip-credits">
      {author?.uid && (
        <p>
          by <Link to={`/u/${author.uid}`}>{author.name || "TravelEz traveler"}</Link>
        </p>
      )}
      {inspiredBy && (
        <p>
          Inspired by <Link to={`/itinerary/${inspiredBy._id}`}>{inspiredBy.title}</Link>
          {inspiredBy.author?.uid && (
            <>
              {" "}
              by{" "}
              <Link to={`/u/${inspiredBy.author.uid}`}>
                {inspiredBy.author.name || "TravelEz traveler"}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );

  const stats = (
    <div className="trip-stats">
      {duration > 0 && (
        <span>
          {duration} day{duration !== 1 ? "s" : ""}
        </span>
      )}
      {itinerary.cost > 0 && <span>${Number(itinerary.cost).toLocaleString()}</span>}
      {averageRating && (
        <span>
          <Star size={13} className="star-icon" fill="var(--star)" /> {averageRating}
        </span>
      )}
      {copyCount > 0 && (
        <span>
          <Copy size={13} /> Copied {copyCount} time{copyCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );

  const copyAction = !isOwner && (
    <>
      <button type="button" className="trip-copy-btn" onClick={handleCopy} disabled={copying}>
        <Copy size={18} /> {copying ? "Copying..." : "Copy to my trips"}
      </button>
      {copyError && <p className="form-error">{copyError}</p>}
    </>
  );

  const hasMap = hasLocation || stops.length > 0;

  return (
    <div className="trip-page">
      <header className="trip-hero">
        {hasCover && (
          <img
            className="trip-hero-photo"
            src={optimizedImageUrl(itinerary.image, 1920)}
            alt=""
            fetchPriority="high"
            onError={() => setHeroFailed(true)}
          />
        )}

        <div className="trip-hero-inner">
          <p className="trip-hero-destination">{itinerary.destination}</p>
          <h1>{itinerary.title}</h1>

          {credits}
          {stats}
          {copyAction && <div className="trip-copy-inline">{copyAction}</div>}
        </div>
      </header>

      <div className={`trip-body ${hasMap ? "" : "trip-body--no-map"}`}>
        {hasMap && (
          <aside className="trip-aside">
            {isStacked && (
              <button
                type="button"
                className="trip-map-toggle"
                onClick={() => setMapOpen((open) => !open)}
                aria-expanded={mapOpen}
              >
                <MapIcon size={18} /> {mapOpen ? "Hide map" : "Show map"}
              </button>
            )}

            {(!isStacked || mapOpen) && (
              <Suspense fallback={<div className="trip-map trip-map--loading">Loading map...</div>}>
                <TripMap location={itinerary.location} title={itinerary.destination} stops={stops} />
              </Suspense>
            )}
          </aside>
        )}

        <div className="trip-main">
          {itinerary.description && (
            <section className="trip-section">
              <h2>Trip Overview</h2>
              <p>{itinerary.description}</p>
            </section>
          )}

          {itinerary.tags?.length > 0 && (
            <div className="tag-list">
              {itinerary.tags.map((tag) => (
                <Link key={tag} to={tagPath(tag)} className="tag-chip tag-chip--static">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {itinerary.days?.length > 0 && (
            <section className="trip-section">
              <h2>Day-by-Day Plan</h2>

              <div className="trip-days">
                {itinerary.days.map((day, index) => (
                  <div className="trip-day" key={index}>
                    <h3>Day {index + 1}</h3>

                    {stops.some((stop) => stop.dayIndex === index) && (
                      <ol className="day-stops">
                        {stops
                          .filter((stop) => stop.dayIndex === index)
                          .map((stop) => (
                            <li key={stop.number}>
                              <span
                                className="day-stop-number"
                                style={{ background: dayColor(index) }}
                              >
                                {stop.number}
                              </span>
                              {stop.name}
                            </li>
                          ))}
                      </ol>
                    )}

                    {[
                      ["Activities", day.activities],
                      ["Restaurants", day.restaurants],
                      ["Transit", day.transit],
                      ["Hotel", day.hotel],
                      ["Notes", day.notes || day.other],
                    ].map(
                      ([label, value]) =>
                        value && (
                          <div className="trip-day-field" key={label}>
                            <span>{label}</span>
                            <p>{value}</p>
                          </div>
                        )
                    )}

                    <PhotoGallery photos={day.photos} label={`Day ${index + 1}`} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="trip-section trip-reviews">
          <h2>Ratings & Comments</h2>

          {!user ? (
            <div className="review-notice">
              <p>Sign in to rate and review this trip.</p>
              <button type="button" className="btn-signin" onClick={signInWithGoogle}>
                Sign in with Google
              </button>
            </div>
          ) : isOwner ? (
            <p className="review-notice">
              This is your trip, so you can't review it. Reviews from other
              travelers will show up here.
            </p>
          ) : hasReviewed ? (
            <p className="review-notice">
              You've reviewed this trip. You can edit or delete your review below.
            </p>
          ) : (
          <form className="comment-form" onSubmit={handleAddComment}>
            <label>
              Rating
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                placeholder="Ex: 4.5"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
                required
              />
            </label>

            <label>
              Comment
              <textarea
                rows="3"
                placeholder="Leave a comment about this trip..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
            </label>

            {reviewError && <p className="form-error">{reviewError}</p>}

            <button type="submit" disabled={submittingReview}>
              {submittingReview ? "Posting..." : "Submit Review"}
            </button>
          </form>
          )}

          {comments.length === 0 ? (
            <p>No comments yet. Be the first to leave a review!</p>
          ) : (
            comments.map((comment) => {
              const commentId = comment._id || comment.id;
              const isEditing = String(editingCommentId) === String(commentId);
              const isCommentOwner = !!user && user.uid === comment.ownerUid;

              return (
                <div className="comment" key={commentId}>
                  {isEditing ? (
                    <>
                      <label>
                        Rating
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={editRating}
                          onChange={(e) => setEditRating(e.target.value)}
                        />
                      </label>

                      <label>
                        Comment
                        <textarea
                          rows="3"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                        />
                      </label>

                      {editError && <p className="form-error">{editError}</p>}

                      <div className="comment-actions">
                        <button
                          type="button"
                          onClick={() => handleUpdateComment(commentId)}
                        >
                          Save
                        </button>

                        <button type="button" onClick={cancelEditingComment}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="comment-username">
                        {comment.username || "Anonymous"}
                      </p>
                      <p className="icon-text">
                        <Star size={15} className="star-icon" fill="var(--star)" />{" "}
                        {Number(comment.rating).toFixed(1)}
                      </p>
                      <p>{comment.text}</p>
                      <small>{new Date(comment.date).toLocaleDateString()}</small>

                      {(isCommentOwner || isAdmin) && (
                        <div className="comment-actions">
                          {isCommentOwner && (
                            <button
                              type="button"
                              onClick={() => startEditingComment(comment)}
                            >
                              Edit
                            </button>
                          )}

                          <button
                            type="button"
                            className="comment-delete-btn"
                            onClick={() => handleDeleteComment(commentId)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
          </section>

          {isAdmin && (
            <button className="btn-admin-delete" onClick={handleAdminDelete}>
              <Trash2 size={15} /> Admin Delete This Trip
            </button>
          )}
        </div>
      </div>

      {copyAction && <div className="trip-copy-bar">{copyAction}</div>}
    </div>
  );
}

export default ItineraryDetail;
