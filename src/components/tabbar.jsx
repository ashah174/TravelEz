import { NavLink, useNavigate } from "react-router-dom";
import { Compass, House, Luggage, Plus, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { to: "/", label: "Home", Icon: House },
  { to: "/results", label: "Explore", Icon: Compass },
  { to: "/create", label: "Create", Icon: Plus, raised: true, needsSignIn: true },
  { to: "/my-itineraries", label: "My Trips", Icon: Luggage, needsSignIn: true },
  { to: "/profile", label: "Profile", Icon: UserRound, needsSignIn: true },
];

// Bottom navigation on phones. CSS hides it on wider screens.
function TabBar() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e, tab) => {
    if (user || !tab.needsSignIn) return;

    e.preventDefault();
    signInWithGoogle()
      .then(() => navigate(tab.to))
      .catch(() => {});
  };

  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `tab-bar-item ${tab.raised ? "tab-bar-item--raised" : ""} ${
              isActive ? "tab-bar-item--active" : ""
            }`
          }
          onClick={(e) => handleClick(e, tab)}
        >
          <span className="tab-bar-icon">
            <tab.Icon size={tab.raised ? 26 : 22} />
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default TabBar;
