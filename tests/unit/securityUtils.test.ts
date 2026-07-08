import { afterEach, describe, expect, it } from "../test-api.ts";
import { AlertSystem } from "../../public/tools/shared/securityUtils.js";

describe("AlertSystem", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("sanitizes unsafe and reserved filenames", () => {
    const alerts = new AlertSystem();
    expect(alerts.sanitizeFilename('../con:test?.png')).toBe("__con_test_.png");
    expect(alerts.sanitizeFilename("a".repeat(300))).toHaveLength(255);
  });

  it("creates alerts with their message and type", () => {
    const alerts = new AlertSystem();
    alerts.showSuccess("Complete");
    expect(document.querySelector(".alert-success")).toHaveTextContent("Complete");
  });
});
