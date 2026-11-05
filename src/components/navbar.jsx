import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SOLID_AFTER_SCROLL = 24;

function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { pathname } = useLocation();
  const [atTop, setAtTop] = useState(() => window.scrollY < SOLID_AFTER_SCROLL);

  useEffect(() => {
    const handleScroll = () => setAtTop(window.scrollY < SOLID_AFTER_SCROLL);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Home's hero photo runs under the navbar, which stays see-through until the
  // page scrolls or the phone menu opens.
  const isHome = pathname === "/";
  const overPhoto = isHome && atTop && !menuOpen;

  const name = user?.displayName || "Profile";

  return (
    <nav
      className={`navbar ${menuOpen ? "navbar--open" : ""} ${isHome ? "navbar--home" : ""} ${
        overPhoto ? "navbar--over-photo" : ""
      }`}
    >
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
        {user ? (
          <>
            <Link to="/results">Explore</Link>
            <Link to="/my-itineraries">My Trips</Link>
            <Link to="/favorites">Favorites</Link>
            <Link to="/create" className="nav-cta">
              Create
            </Link>
            <Link to="/profile" className="nav-profile" aria-label="Profile">
              {user.photoURL ? (
                <img
                  className="nav-avatar"
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="nav-avatar nav-avatar--initial">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="nav-profile-label">Profile</span>
            </Link>
            <button className="btn-signout" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/results">Explore</Link>
            <button className="btn-signin" onClick={signInWithGoogle}>
              Sign up free
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
