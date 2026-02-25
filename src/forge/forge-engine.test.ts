import { describe, it, expect, vi } from "vitest";
import { ForgeEngine } from "./forge-engine.js";

vi.mock("../infra/db.js", () => ({
  getGlobalDb: () => ({
    exec: vi.fn(),
    prepare: vi.fn(() => ({
        all: vi.fn(() => []),
        get: vi.fn(() => ({})),
        run: vi.fn()
    }))
  })
}));

describe("ForgeEngine", () => {
  it("should analyze task failure", async () => {
    const engine = new ForgeEngine();
    await engine.onTaskFailure({
      taskId: "test-task",
      failureReason: "Missing skill",
      context: "User wants to scrape JS site"
    });
    // For now we just check if it runs without error.
    // In a full implementation, we'd verify DB calls and skill generation.
  });
});
