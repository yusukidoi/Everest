import { describe, expect, it } from "vitest";
import { APP_NAME } from "../src/index.js";

describe("project smoke", () => {
  it("exports the application name", () => {
    expect(APP_NAME).toBe("Spaceship X26 PRMS");
  });
});
