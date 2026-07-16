import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useItineraries } from "../context/ItineraryContext";
import ItineraryCard from "../components/itinerarycard";

function Profile() {
  const { user, signInWithGoogle, logout, isAdmin } = useAuth();
  const { myItineraries, favorites } = useItineraries();

  const getProfileKey = () => {
    return user ? `${user.email}_profile` : "guest_profile";
  };

  const defaultProfile = {
    name: user?.displayName || "",
    email: user?.email || "",
    image: user?.photoURL || "",
    preferences: "Budget-friendly, cultural trips, food tours, city exploring",
    uploaded: "",
    saved: "",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const savedProfile =
        JSON.parse(localStorage.getItem(`${user.email}_profile`)) || {};

      setProfile({
        name: savedProfile.name || user.displayName || "",
        email: savedProfile.email || user.email || "",
        image: savedProfile.image || user.photoURL || "",
        preferences:
          savedProfile.preferences ||
          "Budget-friendly, cultural trips, food tours, city exploring",
        uploaded: savedProfile.uploaded || "",
        saved: savedProfile.saved || "",
      });
    };

    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <div className="profile-card">
          <h2>You are not logged in!</h2>
          <p>Please sign in to see your profile.</p>
          <button className="btn-signin" onClick={signInWithGoogle}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = () => {
    localStorage.setItem(getProfileKey(), JSON.stringify(profile));
    setIsEditing(false);
  };

  return (
    <div className="page">
      <div className="profile-card">
        <img
          className="profile-img"
          src={profile.image}
          alt={profile.name}
          referrerPolicy="no-referrer"
        />

        {isEditing ? (
          <>
            <label>
              Profile Picture URL
              <input
                type="text"
                name="image"
                value={profile.image}
                onChange={handleChange}
              />
            </label>

            <label>
              Name
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
              />
            </label>

            <label>
              Travel Preferences
              <textarea
                name="preferences"
                value={profile.preferences}
                onChange={handleChange}
              />
            </label>

            <button className="edit-profile-btn" onClick={saveProfile}>
              Save Changes
            </button>

            <button
              className="cancel-profile-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h1>{profile.name}</h1>
            <p>Email: {profile.email}</p>

            <h2>Travel Preferences</h2>
            <p>{profile.preferences}</p>

            {isAdmin && (
              <p
                className="icon-text"
                style={{ color: "#e11d48", fontWeight: "bold" }}
              >
                <ShieldCheck size={18} /> Admin Account
              </p>
            )}

            <h2>
              Uploaded Itineraries{" "}
              <Link
                to="/my-itineraries"
                className="icon-text"
                style={{ fontSize: "14px", fontWeight: "normal" }}
              >
                View All <ArrowRight size={14} />
              </Link>
            </h2>

            {myItineraries.length === 0 ? (
              <p style={{ color: "#888" }}>No uploaded itineraries yet.</p>
            ) : (
              <div className="card-grid">
                {myItineraries.map((trip) => (
                  <ItineraryCard key={trip._id || trip.id} itinerary={trip} />
                ))}
              </div>
            )}

            <h2>
              Saved Itineraries{" "}
              <Link
                to="/favorites"
                className="icon-text"
                style={{ fontSize: "14px", fontWeight: "normal" }}
              >
                View All <ArrowRight size={14} />
              </Link>
            </h2>

            {favorites.length === 0 ? (
              <p style={{ color: "#888" }}>No saved itineraries yet.</p>
            ) : (
              <div className="card-grid">
                {favorites.map((trip) => (
                  <ItineraryCard key={trip._id || trip.id} itinerary={trip} />
                ))}
              </div>
            )}

            <br />

            <button
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>

            <button className="btn-signout" onClick={logout}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;