import type { ComponentChildren } from "preact";
import "./Button.css";

interface Props {
  children: ComponentChildren;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  type?: "button" | "submit";
  class?: string;
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  type = "button",
  class: extraClass,
}: Props) {
  const cls = ["btn", `btn--${variant}`, extraClass].filter(Boolean).join(" ");
  if (href) {
    return (
      <a href={href} class={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} class={cls}>
      {children}
    </button>
  );
}

interface LoadMoreProps {
  onClick: () => void;
  label?: string;
}

export function LoadMoreButton({
  onClick,
  label = "Load more",
}: LoadMoreProps) {
  return (
    <div class="button-container">
      <button
        class="load-more-button paragraph-caps"
        type="button"
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}

interface LinkButtonProps {
  href: string;
  children: ComponentChildren;
  target?: string;
  rel?: string;
}

export function LinkButton({ href, children, target, rel }: LinkButtonProps) {
  return (
    <div class="button-container-2">
      <button class="button paragraph-caps">
        <a href={href} target={target} rel={rel}>
          {children}
        </a>
        <span class="arrow">›</span>
      </button>
    </div>
  );
}
