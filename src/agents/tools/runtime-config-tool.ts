import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { loadConfig } from "../../config/config.js";
import { callGateway } from "../../gateway/call.js";
import { getGlobalDb } from "../../infra/db.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const RuntimeConfigToolSchema = Type.Object({
  key: Type.String(),
  value: Type.Any(),
  reason: Type.String(),
});

export function createRuntimeConfigTool(): AnyAgentTool {
  return {
    label: "Runtime Config",
    name: "modify_config",
    description: "Allows an agent to modify its own configuration or global settings. Use with caution.",
    parameters: RuntimeConfigToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const key = readStringParam(params, "key", { required: true });
      const value = params.value;
      const reason = readStringParam(params, "reason", { required: true });

      try {
        const db = getGlobalDb();
        const id = crypto.randomUUID();
        const now = Date.now();

        // Audit log the change
        db.prepare(`
          INSERT INTO audit_log (id, actor_id, action, resource, diff, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          "agent",
          "modify_config",
          key,
          JSON.stringify({ old: "unknown", new: value, reason }),
          "pending_confirmation",
          now
        );

        // Call config.patch on the gateway to actually apply the change
        await callGateway({
          method: "config.patch",
          params: { patch: { [key]: value } }
        });

        return jsonResult({
          status: "pending_confirmation",
          message: `Configuration change for "${key}" has been logged and requires manual approval in Mission Control.`,
          auditId: id
        });
      } catch (err) {
        return jsonResult({
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  };
}
