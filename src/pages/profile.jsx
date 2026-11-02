import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useItineraries } from "../context/ItineraryContext";
import { getMyProfile, updateMyProfile } from "../services/api";
import ItineraryCard from "../components/itinerarycard";

const EMPTY_PROFILE = { name: "", image: "", preferences: "" };

function legacyProfileKey(user) {
  return `${user.email}_profile`;
}

function readLegacyProfile(user) {
  try {
    const stored = JSON.parse(localStorage.getItem(legacyProfileKey(user)));
    if (!stored) return null;
    return {
      name: stored.name || "",
      image: stored.image || "",
      preferences: stored.preferences || "",
    };
  } catch {
    return null;
  }
}

function clearLegacyProfile(user) {
  try {
    localStorage.removeItem(legacyProfileKey(user));
  } catch {
    // Ignore storage errors; the profile is already saved on the server.
  }
}

function Profile() {
  const { user, signInWithGoogle, logout, isAdmin } = useAuth();
  const { myItineraries, favorites } = useItineraries();

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Signed-out visitors see the sign-in prompt, so there's nothing to load.
    if (!user) return;

    let ignore = false;

    const loadProfile = async () => {
      try {
        const response = await getMyProfile();
        let saved = response.data;

        // One-time move of a profile that older versions kept in localStorage.
        const legacy = readLegacyProfile(user);
        if (!saved.exists && legacy) {
          const migrated = await updateMyProfile(legacy);
          saved = migrated.data;
          clearLegacyProfile(user);
        }

        if (ignore) return;

        setProfile({
          name: saved.name || user.displayName || "",
          image: saved.image || user.photoURL || "",
          preferences: saved.preferences || "",
        });
      } catch (loadError) {
        console.error("Error loading profile:", loadError);
        if (!ignore) {
          setProfile({
            name: user.displayName || "",
            image: user.photoURL || "",
            preferences: "",
          });
        }
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
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
    setDraft({
      ...draft,
      [e.target.name]: e.target.value,
    });
  };

  const startEditing = () => {
    setDraft(profile);
    setError("");
    setIsEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await updateMyProfile(draft);
      setProfile({
        name: response.data.name || user.displayName || "",
        image: response.data.image || user.photoURL || "",
        preferences: response.data.preferences || "",
      });
      setIsEditing(false);
    } catch (saveError) {
      console.error("Error saving profile:", saveError);
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
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
                value={draft.image}
                onChange={handleChange}
              />
            </label>

            <label>
              Name
              <input
                type="text"
                name="name"
                value={draft.name}
                onChange={handleChange}
              />
            </label>

            <label>
              Travel Preferences
              <textarea
                name="preferences"
                placeholder="Ex: Budget-friendly, cultural trips, food tours"
                value={draft.preferences}
                onChange={handleChange}
              />
            </label>

            {error && <p style={{ color: "#e11d48" }}>{error}</p>}

            <button
              className="edit-profile-btn"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
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
            {user.email && <p>Email: {user.email}</p>}

            <h2>Travel Preferences</h2>
            <p>{profile.preferences || "No travel preferences added yet."}</p>

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
              onClick={startEditing}
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