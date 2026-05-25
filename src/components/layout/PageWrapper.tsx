import type { ComponentChildren } from "preact";
import "./PageWrapper.css";

interface Props {
  children: ComponentChildren;
}

export function PageWrapper({ children }: Props) {
  return (
    <main class="main-content">
      <div class="main">{children}</div>
    </main>
  );
}
