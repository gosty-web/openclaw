import { describe, it, expect, vi } from "vitest";
import { HiveManager } from "./hive-manager.js";
import { callGateway } from "../gateway/call.js";

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

vi.mock("../gateway/call.js", () => ({
  callGateway: vi.fn()
}));

describe("HiveManager", () => {
  it("should spawn a team", async () => {
    const manager = new HiveManager();

    // First call to suggest team
    (callGateway as any).mockResolvedValueOnce({
        text: JSON.stringify([
            { role: "Coder", agentId: "coder-agent", specialty: ["ts"] },
            { role: "Tester", agentId: "tester-agent", specialty: ["vitest"] },
            { role: "Writer", agentId: "writer-agent", specialty: ["markdown"] }
        ])
    });

    // Subsequent calls to spawn members
    (callGateway as any).mockResolvedValue({ runId: "test-run-id" });

    const runIds = await manager.spawnTeam({
      teamName: "Test Team",
      goal: "Test Goal",
      parentSessionKey: "parent-key"
    });

    expect(runIds).toHaveLength(3);
    expect(runIds[0]).toBe("test-run-id");
    expect(callGateway).toHaveBeenCalledTimes(4); // 1 (composition) + 3 (spawn)
  });
});
