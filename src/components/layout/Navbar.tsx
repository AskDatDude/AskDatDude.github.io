import { useLocation } from "preact-iso";
import "./Navbar.css";

export function Navbar() {
  const { url } = useLocation();
  // Show back button when on a detail page (/work/slug or /writing/slug)
  const isDetail = /^\/(work|writing)\/[^/]+/.test(url);

  return (
    <header class="header">
      <div class="header-box">
        <a href="/" class="h1">
          Robin Niinemets
        </a>
        <span class="h1">Cybersecurity Student</span>
        <span class="h1 hide-on-mobile">Helsinki, Finland</span>
        {isDetail && (
          <a
            class="close-button"
            onClick={() => history.back()}
            aria-label="Go back"
          >
            &times;
          </a>
        )}
      </div>
      <div class="line"></div>
    </header>
  );
}
