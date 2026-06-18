import { fireEvent, waitFor } from "@testing-library/preact";
import { beforeEach, describe, expect, it } from "bun:test";
import { initImageConverter } from "../../public/tools/shared/imageConverter.js";
import { initQRGenerator } from "../../public/tools/shared/qrGenerator.js";

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("standalone tool behavior", () => {
  it("builds the QR interface and validates empty input", () => {
    document.body.innerHTML = '<div id="qr-container"></div>';
    initQRGenerator();

    expect(document.querySelector("#url-input")).toBeInTheDocument();
    expect(document.querySelector("#qr-placeholder")).toBeVisible();

    fireEvent.click(document.querySelector("#generate-btn")!);
    expect(document.querySelector(".alert-error")).toHaveTextContent(
      "Please enter a valid URL or text",
    );
  });

  it("generates and clears a QR code using the local fallback path", async () => {
    const context = {
      clearRect() {},
      fillRect() {},
      drawImage() {},
      fillText() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      set fillStyle(_value: string) {},
      set font(_value: string) {},
      set textAlign(_value: string) {},
    };
    HTMLCanvasElement.prototype.getContext = () => context as never;
    class FailedImage {
      onerror?: () => void;
      set crossOrigin(_value: string) {}
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    globalThis.Image = FailedImage as never;

    document.body.innerHTML = '<div id="qr-container"></div>';
    initQRGenerator();
    fireEvent.input(document.querySelector("#url-input")!, {
      target: { value: "https://example.com" },
    });
    fireEvent.click(document.querySelector("#generate-btn")!);

    await waitFor(() => expect(document.querySelector("#qr-code-display")).toBeVisible());
    expect(document.querySelector("#download-btn")).toBeVisible();

    fireEvent.click(document.querySelector("#clear-btn")!);
    expect(document.querySelector("#qr-placeholder")).toBeVisible();
  });

  it("loads valid images into the converter and clears its state", () => {
    document.body.innerHTML = '<div id="image-converter-container"></div>';
    initImageConverter();

    const fileInput = document.querySelector<HTMLInputElement>("#fileInput")!;
    const controls = document.querySelector<HTMLElement>("#controlsSection")!;
    expect(controls).not.toBeVisible();

    fireEvent.change(fileInput, {
      target: { files: [new File(["image"], "example.png", { type: "image/png" })] },
    });
    expect(controls).toBeVisible();
    expect(document.querySelector(".upload-content p")).toHaveTextContent(
      "1 image selected",
    );

    fireEvent.click(document.querySelector("#clearBtn")!);
    expect(controls).not.toBeVisible();
  });

  it("rejects non-image files without exposing conversion controls", () => {
    document.body.innerHTML = '<div id="image-converter-container"></div>';
    initImageConverter();

    fireEvent.change(document.querySelector("#fileInput")!, {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });
    expect(document.querySelector("#controlsSection")).not.toBeVisible();
    expect(document.querySelector(".alert-error")).toHaveTextContent(
      "No valid image files found",
    );
  });
});
