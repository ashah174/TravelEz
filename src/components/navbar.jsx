import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={`navbar ${menuOpen ? "navbar--open" : ""}`}>
      <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
        TravelEz
      </Link>

      <button
        type="button"
        className="nav-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="nav-links"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Clicking any link or button inside closes the mobile menu. */}
      <div id="nav-links" className="nav-links" onClick={() => setMenuOpen(false)}>
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
