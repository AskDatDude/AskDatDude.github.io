import "./Breadcrumbs.css";

export function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}
