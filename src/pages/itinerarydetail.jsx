import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Copy, Star, Trash2 } from "lucide-react";
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
import { optimizedImageUrl } from "../utils/images";
import { dayColor, getTripStops } from "../utils/stops";
import { tagPath } from "../constants/tags";
import PhotoGallery from "../components/photogallery";

const TripMap = lazy(() => import("../components/tripmap"));


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

  if (loading) {
    return (
      <div className="page">
        <div className="detail-card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="page">
        <div className="detail-card">
          <h1>Itinerary not found</h1>
        </div>
      </div>
    );
  }

  const comments = itinerary.comments || [];

  const averageRating = formatRating(getAverageRating(itinerary));

  const duration = itinerary.duration || itinerary.days?.length || 0;

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
      setCopyError("Couldn't copy this itinerary. Please try again.");
      setCopying(false);
    }
  };

  const handleAdminDelete = () => {
    deleteItinerary(id);
    navigate("/");
  };

  return (
    <div className="page">
      <div className="detail-card">
        {isAdmin && (
          <button className="btn-admin-delete" onClick={handleAdminDelete}>
            <Trash2 size={15} /> Admin Delete This Itinerary
          </button>
        )}

        <h1>{itinerary.title}</h1>
        <p className="subtitle">{itinerary.destination}</p>

        {author?.uid && (
          <p className="card-author">
            by{" "}
            <Link to={`/u/${author.uid}`}>{author.name || "TravelEz traveler"}</Link>
          </p>
        )}

        {inspiredBy && (
          <p className="card-author">
            Inspired by{" "}
            <Link to={`/itinerary/${inspiredBy._id}`}>{inspiredBy.title}</Link>
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

        {itinerary.tags?.length > 0 && (
          <div className="tag-list">
            {itinerary.tags.map((tag) => (
              <Link
                key={tag}
                to={tagPath(tag)}
                className="tag-chip tag-chip--static"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {!isOwner && (
          <div className="detail-actions">
            <button
              type="button"
              className="copy-trip-btn"
              onClick={handleCopy}
              disabled={copying}
            >
              <Copy size={16} /> {copying ? "Copying..." : "Copy to my trips"}
            </button>
            {copyError && <p className="form-error">{copyError}</p>}
          </div>
        )}

        {averageRating && (
          <p className="detail-rating icon-text">
            <Star size={20} className="star-icon" fill="#c9a87c" /> {averageRating}
          </p>
        )}

        {copyCount > 0 && (
          <p className="copy-count icon-text">
            <Copy size={16} /> Copied {copyCount} time{copyCount !== 1 ? "s" : ""}
          </p>
        )}

        {itinerary.image && (
          <img
            src={optimizedImageUrl(itinerary.image, 1200)}
            alt={itinerary.title}
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "cover",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          />
        )}

        {itinerary.description && (
          <>
            <h2>Trip Overview</h2>
            <p>{itinerary.description}</p>
          </>
        )}

        {(hasLocation || stops.length > 0) && (
          <>
            <h2>Where</h2>
            <Suspense fallback={<div className="trip-map trip-map--loading">Loading map...</div>}>
              <TripMap location={itinerary.location} title={itinerary.destination} stops={stops} />
            </Suspense>
          </>
        )}

        {itinerary.days?.length > 0 && (
          <>
            <h2>Day-by-Day Plan</h2>

            {itinerary.days.map((day, index) => (
              <div className="day-box" key={index}>
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

                {day.activities && (
                  <p>
                    <strong>Activities:</strong> {day.activities}
                  </p>
                )}
                {day.restaurants && (
                  <p>
                    <strong>Restaurants:</strong> {day.restaurants}
                  </p>
                )}
                {day.transit && (
                  <p>
                    <strong>Transit:</strong> {day.transit}
                  </p>
                )}
                {day.hotel && (
                  <p>
                    <strong>Hotel:</strong> {day.hotel}
                  </p>
                )}
                {(day.notes || day.other) && (
                  <p>
                    <strong>Notes:</strong> {day.notes || day.other}
                  </p>
                )}

                <PhotoGallery photos={day.photos} label={`Day ${index + 1}`} />
              </div>
            ))}
          </>
        )}

        <h2>Trip Information</h2>

        {duration > 0 && (
          <p>
            <strong>Duration:</strong> {duration} day
            {duration !== 1 ? "s" : ""}
          </p>
        )}

        {itinerary.cost > 0 && (
          <p>
            <strong>Estimated Cost:</strong> $
            {Number(itinerary.cost).toLocaleString()}
          </p>
        )}

        <h2>Ratings & Comments</h2>

        {!user ? (
          <div className="review-notice">
            <p>Sign in to rate and review this itinerary.</p>
            <button type="button" className="btn-signin" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          </div>
        ) : isOwner ? (
          <p className="review-notice">
            This is your itinerary, so you can't review it. Reviews from other
            travelers will show up here.
          </p>
        ) : hasReviewed ? (
          <p className="review-notice">
            You've reviewed this itinerary. You can edit or delete your review below.
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
              placeholder="Leave a comment about this itinerary..."
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
                      <Star size={15} className="star-icon" fill="#c9a87c" />{" "}
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
      </div>
    </div>
  );
}

export default ItineraryDetail;