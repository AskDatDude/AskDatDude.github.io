import { useEffect } from "preact/hooks";

interface BackToTopProps {
  variant: "project" | "diary";
}

export function BackToTop({ variant }: BackToTopProps) {
  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>(
      `.back-to-top.${variant}-page`,
    );
    const footer = document.querySelector<HTMLElement>("footer.footer");

    if (!button) return;

    const updateButton = () => {
      const threshold = variant === "project" ? 1300 : 300;
      const shouldShow = window.scrollY > threshold;
      button.classList.toggle("visible", shouldShow);

      if (!footer || !shouldShow) {
        button.style.bottom = "30px";
        return;
      }

      const footerDistanceFromBottom =
        window.innerHeight - footer.getBoundingClientRect().top;
      button.style.bottom =
        footerDistanceFromBottom > 0
          ? `${footerDistanceFromBottom + 30}px`
          : "30px";
    };

    window.addEventListener("scroll", updateButton, { passive: true });
    window.addEventListener("resize", updateButton);
    updateButton();

    return () => {
      window.removeEventListener("scroll", updateButton);
      window.removeEventListener("resize", updateButton);
    };
  }, [variant]);

  return (
    <button
      class={`back-to-top ${variant}-page`}
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
}
