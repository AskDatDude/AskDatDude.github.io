import "./Footer.css";

export function Footer() {
  return (
    <footer class="footer">
      <div class="version-button">
        <a href="https://github.com/AskDatDude/AskDatDude.github.io">
          <p>V3.0.0</p>
        </a>
      </div>
      <div class="version-updated h2">
        Last updated <br />
        <p>15.6.2026</p>
      </div>
      <div class="social-bar">
        <a href="https://github.com/AskDatDude" aria-label="GitHub">
          <img
            class="social-links"
            src="https://img.icons8.com/?size=100&id=62856&format=png&color=5D5D5D"
            alt="github icon"
          />
        </a>
        <a
          href="https://www.linkedin.com/in/robin-niinemets-496194185/"
          aria-label="LinkedIn"
        >
          <img
            class="social-links"
            src="https://img.icons8.com/?size=100&id=8808&format=png&color=5D5D5D"
            alt="linkedin icon"
          />
        </a>
        <a href="mailto:robba355@gmail.com" aria-label="Email">
          <img
            class="social-links"
            src="https://img.icons8.com/?size=100&id=85467&format=png&color=5D5D5D"
            alt="email icon"
          />
        </a>
      </div>
    </footer>
  );
}
