import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useItineraries } from "../context/ItineraryContext";
import { getFollowing, getMyProfile, updateMyProfile } from "../services/api";
import ImageUpload from "../components/imageupload";
import { optimizedImageUrl } from "../utils/images";
import ItineraryCard from "../components/itinerarycard";

const EMPTY_PROFILE = { name: "", image: "", preferences: "" };

function legacyProfileKey(user) {
  return `${user.email}_profile`;
}

function readLegacyProfile(user) {
  try {
    const stored = JSON.parse(localStorage.getItem(legacyProfileKey(user)));
    if (!stored) return null;

    // Only carry over fields the user actually filled in, so we never blank
    // out values already saved on the server.
    const legacy = {};
    ["name", "image", "preferences"].forEach((field) => {
      if (typeof stored[field] === "string" && stored[field].trim()) {
        legacy[field] = stored[field];
      }
    });
    return legacy;
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
  const [following, setFollowing] = useState([]);
  const viewerUid = user?.uid;

  useEffect(() => {
    if (!viewerUid) return;

    let ignore = false;

    getFollowing()
      .then((response) => {
        if (!ignore) setFollowing(response.data);
      })
      .catch((followingError) =>
        console.error("Error loading following list:", followingError)
      );

    return () => {
      ignore = true;
    };
  }, [viewerUid]);

  useEffect(() => {
    // Signed-out visitors see the sign-in prompt, so there's nothing to load.
    if (!user) return;

    let ignore = false;

    const loadProfile = async () => {
      try {
        // One-time move of a profile that older versions kept in localStorage.
        const legacy = readLegacyProfile(user);
        if (legacy) {
          await updateMyProfile(legacy);
          clearLegacyProfile(user);
        }

        const response = await getMyProfile();
        const saved = response.data;

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
            Sign in with Google
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
        {profile.image ? (
          <img
            className="profile-img"
            src={optimizedImageUrl(profile.image, 240)}
            alt={profile.name}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="profile-img profile-img--placeholder">
            {(profile.name || user.displayName || "T").charAt(0).toUpperCase()}
          </div>
        )}

        {isEditing ? (
          <>
            <ImageUpload
              label="Profile picture"
              maxSize={600}
              value={draft.image}
              onChange={(image) => setDraft((prev) => ({ ...prev, image }))}
            />

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

            {error && <p className="form-error">{error}</p>}

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
            <p>
              <Link to={`/u/${user.uid}`} className="icon-text">
                View your public profile <ArrowRight size={14} />
              </Link>
            </p>

            <h2>Travel Preferences</h2>
            <p>{profile.preferences || "No travel preferences added yet."}</p>

            {isAdmin && (
              <p className="icon-text profile-admin-label">
                <ShieldCheck size={18} /> Admin Account
              </p>
            )}

            <h2>Following</h2>

            {following.length === 0 ? (
              <p className="profile-empty">
                You aren't following anyone yet. Open a traveler's profile to
                follow them.
              </p>
            ) : (
              <div className="following-list">
                {following.map((person) => {
                  const personName = person.name || "TravelEz traveler";
                  return (
                    <Link key={person.uid} to={`/u/${person.uid}`} className="following-chip">
                      {person.image ? (
                        <img
                          src={optimizedImageUrl(person.image, 64)}
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="following-chip-initial">
                          {personName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {personName}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="profile-section-head">
              <h2>My Trips</h2>
              <Link to="/my-itineraries" className="home-section-link">
                View all →
              </Link>
            </div>

            {myItineraries.length === 0 ? (
              <p className="profile-empty">No trips yet.</p>
            ) : (
              <div className="card-grid">
                {myItineraries.map((trip) => (
                  <ItineraryCard key={trip._id || trip.id} itinerary={trip} />
                ))}
              </div>
            )}

            <div className="profile-section-head">
              <h2>Favorites</h2>
              <Link to="/favorites" className="home-section-link">
                View all →
              </Link>
            </div>

            {favorites.length === 0 ? (
              <p className="profile-empty">No favorites yet.</p>
            ) : (
              <div className="card-grid">
                {favorites.map((trip) => (
                  <ItineraryCard key={trip._id || trip.id} itinerary={trip} />
                ))}
              </div>
            )}

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