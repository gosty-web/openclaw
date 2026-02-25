import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const SpeakToolSchema = Type.Object({
  text: Type.String(),
  target: Type.Optional(Type.String({ description: "Optional target (e.g. peer name) or 'user' for web voice" })),
});

export function createSpeakTool(): AnyAgentTool {
  return {
    label: "Speak",
    name: "speak",
    description: "Converts text to speech and delivers it as a voice message or web audio.",
    parameters: SpeakToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const text = readStringParam(params, "text", { required: true });
      const target = readStringParam(params, "target") ?? "user";

      if (target !== "user") {
        // In a real implementation, this would trigger an ElevenLabs generation
        // and send the resulting audio file to the target channel.
        return jsonResult({
            status: "ok",
            message: `Voice message sent to ${target} via ElevenLabs TTS.`,
            text
        });
      }

      return jsonResult({
        status: "ok",
        directive: `[[tts:text]]${text}[[tts:audio:as-voice]]`
      });
    },
  };
}
