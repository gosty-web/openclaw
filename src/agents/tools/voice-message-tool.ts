import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";
import { callGateway } from "../../gateway/call.js";
import { getGlobalDb } from "../../infra/db.js";

const VoiceMessageToolSchema = Type.Object({
  text: Type.String(),
  voice: Type.Optional(Type.String()),
});

export function createVoiceMessageTool(): AnyAgentTool {
  return {
    label: "Voice Message",
    name: "voice_message",
    description: "Sends a voice message to the user using ElevenLabs or Gemini native voice.",
    parameters: VoiceMessageToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const text = readStringParam(params, "text", { required: true });
      const voice = readStringParam(params, "voice");

      try {
        const db = getGlobalDb();
        db.prepare(`
          INSERT INTO audit_log (id, actor_id, action, resource, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), "agent", "voice_message", "user", "ok", Date.now());

        return jsonResult({
            status: "ok",
            directive: `[[tts:text]]${text}${voice ? `[[tts:voiceid=${voice}]]` : ""}[[tts:audio:as-voice]]`
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
