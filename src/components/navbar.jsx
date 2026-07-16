import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        TravelEz
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/search">Search</Link>
        <Link to="/public">Public Itineraries</Link>
        <Link to="/favorites">Favorites</Link>
        <Link to="/my-itineraries">My Itineraries</Link>
        <Link to="/profile">Profile</Link>

        {user ? (
          <button className="btn-signout" onClick={logout}>
            Sign Out
          </button>
        ) : (
          <button className="btn-signin" onClick={signInWithGoogle}>
            Login!
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
