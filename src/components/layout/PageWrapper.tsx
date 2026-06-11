import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import "./PageWrapper.css";

interface Props {
  children: ComponentChildren;
}

export function PageWrapper({ children }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Keeps the old "fade-in" behavior from the legacy loading screen,
    // while ensuring content isn't permanently stuck at opacity: 0.
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main class={visible ? "main-content visible" : "main-content"}>
      <div class="main">{children}</div>
    </main>
  );
}
