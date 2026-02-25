import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { loadConfig } from "../../config/config.js";
import { callGateway } from "../../gateway/call.js";
import {
  type GatewayMessageChannel,
  INTERNAL_MESSAGE_CHANNEL,
} from "../../utils/message-channel.js";
import { AGENT_LANE_NESTED } from "../lanes.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";
import {
  resolveSandboxedSessionToolContext,
} from "./sessions-helpers.js";
import { buildAgentToAgentMessageContext, resolvePingPongTurns } from "./sessions-send-helpers.js";
import { runSessionsSendA2AFlow } from "./sessions-send-tool.a2a.js";

const AgentSendToolSchema = Type.Object({
  agentId: Type.String({ minLength: 1, maxLength: 64 }),
  message: Type.String(),
  timeoutSeconds: Type.Optional(Type.Number({ minimum: 0 })),
});

export function createAgentSendTool(opts?: {
  agentSessionKey?: string;
  agentChannel?: GatewayMessageChannel;
  sandboxed?: boolean;
}): AnyAgentTool {
  return {
    label: "Agent Send",
    name: "agent_send",
    description: "Send a message directly to another agent by their agentId.",
    parameters: AgentSendToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const agentId = readStringParam(params, "agentId", { required: true });
      const message = readStringParam(params, "message", { required: true });
      const cfg = loadConfig();
      const { effectiveRequesterKey } = resolveSandboxedSessionToolContext({
        cfg,
        agentSessionKey: opts?.agentSessionKey,
        sandboxed: opts?.sandboxed,
      });

      const timeoutSeconds =
        typeof params.timeoutSeconds === "number" && Number.isFinite(params.timeoutSeconds)
          ? Math.max(0, Math.floor(params.timeoutSeconds))
          : 30;
      const timeoutMs = timeoutSeconds * 1000;
      const announceTimeoutMs = timeoutSeconds === 0 ? 30_000 : timeoutMs;
      const idempotencyKey = crypto.randomUUID();

      const targetSessionKey = agentId.includes(":") ? agentId : `main:${agentId}`;

      const agentMessageContext = buildAgentToAgentMessageContext({
        requesterSessionKey: opts?.agentSessionKey,
        requesterChannel: opts?.agentChannel,
        targetSessionKey: targetSessionKey,
      });

      // Enhance with Hive context if available
      const hiveContext = `You are part of a Hive collaboration mesh.
Collaborate effectively with the requester agent (${opts?.agentSessionKey}).`;

      const sendParams = {
        message,
        sessionKey: targetSessionKey,
        idempotencyKey,
        deliver: false,
        channel: INTERNAL_MESSAGE_CHANNEL,
        lane: AGENT_LANE_NESTED,
        extraSystemPrompt: agentMessageContext,
        inputProvenance: {
          kind: "inter_session",
          sourceSessionKey: opts?.agentSessionKey,
          sourceChannel: opts?.agentChannel,
          sourceTool: "agent_send",
        },
      };

      try {
        const response = await callGateway<{ runId: string }>({
          method: "agent",
          params: {
            ...sendParams,
            extraSystemPrompt: (sendParams.extraSystemPrompt || "") + "\n\n" + hiveContext
          },
          timeoutMs: 10_000,
        });
        const runId = response?.runId || crypto.randomUUID();

        if (timeoutSeconds > 0) {
            await callGateway({
              method: "agent.wait",
              params: { runId, timeoutMs },
              timeoutMs: timeoutMs + 2000,
            });
        }

        const maxPingPongTurns = resolvePingPongTurns(cfg);
        void runSessionsSendA2AFlow({
          targetSessionKey,
          displayKey: agentId,
          message,
          announceTimeoutMs,
          maxPingPongTurns,
          requesterSessionKey: opts?.agentSessionKey,
          requesterChannel: opts?.agentChannel,
          waitRunId: runId,
        });

        return jsonResult({
          runId,
          status: "ok",
          agentId,
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
