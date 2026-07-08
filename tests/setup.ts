import { JSDOM } from "jsdom";
import { afterEach, expect, mock } from "./test-api.ts";

if (typeof window === "undefined") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const globalValues = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLSelectElement: dom.window.HTMLSelectElement,
    HTMLCanvasElement: dom.window.HTMLCanvasElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    CustomEvent: dom.window.CustomEvent,
    File: dom.window.File,
    Blob: dom.window.Blob,
    Image: dom.window.Image,
    URL: dom.window.URL,
    getComputedStyle: dom.window.getComputedStyle,
    localStorage: dom.window.localStorage,
    history: dom.window.history,
    location: dom.window.location,
  };
  for (const [key, value] of Object.entries(globalValues)) {
    try {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      });
    } catch {
      // ponytail: Deno worker globals like location can be read-only; use window.location there.
    }
  }
}

const matchers = await import("@testing-library/jest-dom/matchers");
expect.extend(matchers);
const { cleanup } = await import("@testing-library/preact");

afterEach(() => cleanup());

Object.defineProperty(window, "requestAnimationFrame", {
  configurable: true,
  value: (callback: FrameRequestCallback) => window.setTimeout(callback, 0),
});
Object.defineProperty(globalThis, "requestAnimationFrame", {
  configurable: true,
  value: window.requestAnimationFrame,
});

Object.defineProperty(window, "cancelAnimationFrame", {
  configurable: true,
  value: (id: number) => window.clearTimeout(id),
});
Object.defineProperty(globalThis, "cancelAnimationFrame", {
  configurable: true,
  value: window.cancelAnimationFrame,
});

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: mock(),
});

if (!globalThis.CSS) {
  Object.defineProperty(globalThis, "CSS", { value: {} });
}

if (!CSS.escape) {
  CSS.escape = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
