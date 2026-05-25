import type { ComponentChildren } from "preact";
import "./Card.css";

interface Props {
  children: ComponentChildren;
  href: string;
  variant?: "project" | "list";
  class?: string;
}

export function Card({
  children,
  href,
  variant = "project",
  class: extraClass,
}: Props) {
  const base = variant === "project" ? "big-card-box" : "diary-list";
  const cls = extraClass ? `${base} ${extraClass}` : base;
  return (
    <div class={cls}>
      <a href={href}>{children}</a>
    </div>
  );
}
