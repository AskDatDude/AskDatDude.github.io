declare global {
  interface Window {
    Prism?: {
      highlightAllUnder: (container: ParentNode) => void;
    };
  }
}

export function highlightCode(container: ParentNode | null): void {
  if (!container || !window.Prism) return;
  window.Prism.highlightAllUnder(container);
}
