import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <Link to="/" className="logo">
        TravelEz
      </Link>
      <p>Made for wanderers.</p>
    </footer>
  );
}

export default Footer;
