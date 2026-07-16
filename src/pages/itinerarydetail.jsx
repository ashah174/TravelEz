import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Trash2 } from "lucide-react";
import {
  getItineraryById,
  addCommentToItinerary,
  updateCommentOnItinerary,
  deleteCommentFromItinerary,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useItineraries } from "../context/ItineraryContext";

const sampleItineraries = [
  {
    id: 1,
    title: "5 Days in Paris",
    destination: "Paris, France",
    duration: 5,
    cost: 1200,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
    description: "A classic Paris trip with sightseeing, food, and museums.",
    days: [
      { activities: "Visit the Eiffel Tower, walk around the Seine, and try a local café." },
      { activities: "Explore the Louvre Museum and nearby restaurants." },
      { activities: "Visit Montmartre, Sacré-Cœur, and local shops." },
    ],
    comments: [],
  },
  {
    id: 2,
    title: "Japan Food Tour",
    destination: "Tokyo, Japan",
    duration: 7,
    cost: 1800,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
    description: "A food-focused Tokyo itinerary with markets, ramen, sushi, and city exploring.",
    days: [
      { activities: "Explore Shibuya, visit food stalls, and try ramen." },
      { activities: "Visit Tsukiji Outer Market and try sushi." },
      { activities: "Explore Harajuku, cafés, and street snacks." },
    ],
    comments: [],
  },
  {
    id: 3,
    title: "Budget Weekend in NYC",
    destination: "New York City",
    duration: 3,
    cost: 600,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625",
    description: "A short NYC weekend trip focused on affordable sights, food, and walking routes.",
    days: [
      { activities: "Walk through Central Park and visit Times Square." },
      { activities: "Explore Brooklyn Bridge, DUMBO, and local pizza spots." },
      { activities: "Visit museums, food carts, and free city viewpoints." },
    ],
    comments: [],
  },
];

function ItineraryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { deleteItinerary } = useItineraries();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newRating, setNewRating] = useState("");
  const [newComment, setNewComment] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editRating, setEditRating] = useState("");
  const [editComment, setEditComment] = useState("");

  const isSampleTrip = ["1", "2", "3"].includes(String(id));

  useEffect(() => {
    const sampleTrip = sampleItineraries.find(
      (trip) => String(trip.id) === String(id)
    );

    const applySampleTrip = async () => {
      setItinerary(sampleTrip);
      setLoading(false);
    };

    if (sampleTrip) {
      applySampleTrip();
      return;
    }

    const loadItinerary = async () => {
      try {
        const response = await getItineraryById(id);
        setItinerary(response.data);
      } catch (error) {
        console.error("Error loading itinerary:", error);
        setItinerary(null);
      } finally {
        setLoading(false);
      }
    };

    loadItinerary();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    const ratingValue = Number(newRating);

    if (!newComment.trim() || ratingValue < 1 || ratingValue > 5) return;

    const commentData = {
      rating: ratingValue,
      text: newComment.trim(),
      username: user?.displayName || "Anonymous",
    };

    if (isSampleTrip) {
      alert("This is a demo itinerary,comments won't be saved. Go to public itineraries to leave comments and check out trips");
      return;
    }

    try {
      const response = await addCommentToItinerary(id, commentData);
      setItinerary(response.data);
    } catch (error) {
      console.error("Error adding comment:", error);
    }

    setNewRating("");
    setNewComment("");
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id || comment.id);
    setEditRating(String(comment.rating));
    setEditComment(comment.text);
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

    if (isSampleTrip) {
      setItinerary((prev) => ({
        ...prev,
        comments: prev.comments.map((comment) =>
          String(comment._id || comment.id) === String(commentId)
            ? { ...comment, ...updatedCommentData }
            : comment
        ),
      }));
    } else {
      try {
        const response = await updateCommentOnItinerary(
          id,
          commentId,
          updatedCommentData
        );
        setItinerary(response.data);
      } catch (error) {
        console.error("Error updating comment:", error);
      }
    }

    cancelEditingComment();
  };

  const handleDeleteComment = async (commentId) => {
    if (isSampleTrip) {
      setItinerary((prev) => ({
        ...prev,
        comments: prev.comments.filter(
          (comment) => String(comment._id || comment.id) !== String(commentId)
        ),
      }));
      return;
    }

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

  const averageRating =
    comments.length > 0
      ? (
          comments.reduce((sum, comment) => sum + Number(comment.rating), 0) /
          comments.length
        ).toFixed(1)
      : itinerary.rating;

  const duration = itinerary.duration || itinerary.days?.length || 0;

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

        {averageRating && (
          <p className="detail-rating icon-text">
            <Star size={20} className="star-icon" fill="#c9a87c" /> {averageRating}
          </p>
        )}

        {itinerary.image && (
          <img
            src={itinerary.image}
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

        {itinerary.days?.length > 0 && (
          <>
            <h2>Day-by-Day Plan</h2>

            {itinerary.days.map((day, index) => (
              <div className="day-box" key={index}>
                <h3>Day {index + 1}</h3>

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

          <button type="submit">Submit Review</button>
        </form>

        {comments.length === 0 ? (
          <p>No comments yet. Be the first to leave a review!</p>
        ) : (
          comments.map((comment) => {
            const commentId = comment._id || comment.id;
            const isEditing = String(editingCommentId) === String(commentId);

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

                    {(user?.email === comment.ownerEmail || isAdmin) && (
                      <div className="comment-actions">
                        {user?.email === comment.ownerEmail && (
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