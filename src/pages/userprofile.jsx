import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, MapPinned, Star } from "lucide-react";
import ItineraryCard from "../components/itinerarycard";
import { getUserProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatRating } from "../utils/rating";
import { optimizedImageUrl } from "../utils/images";

function UserProfile() {
  const { uid } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const response = await getUserProfile(uid);
        if (!ignore) setData(response.data);
      } catch (error) {
        console.error("Error loading user profile:", error);
        if (!ignore) {
          setData(null);
          setNotFound(true);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [uid]);

  if (loading) {
    return (
      <div className="page">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="page">
        <div className="profile-card">
          <h2>Traveler not found</h2>
          <p>This profile doesn't exist or has no public trips yet.</p>
        </div>
      </div>
    );
  }

  const { profile, itineraries, stats } = data;
  const name = profile.name || "TravelEz traveler";
  const isMe = user?.uid === uid;
  const averageRating = formatRating(stats.averageRating);

  return (
    <div className="page">
      <div className="profile-card public-profile">
        {profile.image ? (
          <img
            className="profile-img"
            src={optimizedImageUrl(profile.image, 240)}
            alt={name}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="profile-img profile-img--placeholder">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <h1>{name}</h1>

        <div className="profile-stats">
          <span className="icon-text">
            <MapPinned size={16} /> {stats.tripCount} public trip
            {stats.tripCount !== 1 ? "s" : ""}
          </span>
          {averageRating && (
            <span className="icon-text">
              <Star size={16} className="star-icon" fill="#c9a87c" /> {averageRating}{" "}
              avg from {stats.reviewCount} review{stats.reviewCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="icon-text">
            <Heart size={16} /> {stats.favoriteCount} favorite
            {stats.favoriteCount !== 1 ? "s" : ""}
          </span>
        </div>

        {profile.preferences && (
          <>
            <h2>Travel Preferences</h2>
            <p>{profile.preferences}</p>
          </>
        )}

        {isMe && (
          <p>
            <Link to="/profile" className="public-hint">
              This is your public profile. Edit it from your Profile page.
            </Link>
          </p>
        )}
      </div>

      <h2 className="section-heading">Trips by {name}</h2>

      {itineraries.length > 0 ? (
        <div className="card-grid">
          {itineraries.map((trip) => (
            <ItineraryCard key={trip._id} itinerary={trip} showAuthor={false} />
          ))}
        </div>
      ) : (
        <p className="public-hint">No public trips yet.</p>
      )}
    </div>
  );
}

export default UserProfile;
