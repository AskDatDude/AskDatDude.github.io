import { describe, expect, it, mock } from "bun:test";
import { highlightCode } from "../../src/utils/prism";

describe("highlightCode", () => {
  it("delegates to Prism when available", () => {
    const highlightAllUnder = mock();
    window.Prism = { highlightAllUnder };
    const container = document.createElement("article");
    highlightCode(container);
    expect(highlightAllUnder).toHaveBeenCalledWith(container);
  });

  it("does nothing without a container or Prism", () => {
    delete window.Prism;
    expect(() => highlightCode(null)).not.toThrow();
    expect(() => highlightCode(document.body)).not.toThrow();
  });
});
