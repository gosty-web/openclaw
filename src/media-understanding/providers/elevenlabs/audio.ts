import path from "node:path";
import type { AudioTranscriptionRequest, AudioTranscriptionResult } from "../../types.js";
import {
  assertOkOrThrowHttpError,
  normalizeBaseUrl,
  postTranscriptionRequest,
  requireTranscriptionText,
} from "../shared.js";

export const DEFAULT_ELEVENLABS_AUDIO_BASE_URL = "https://api.elevenlabs.io/v1";
const DEFAULT_ELEVENLABS_AUDIO_MODEL = "scribe_v1";

function resolveModel(model?: string): string {
  const trimmed = model?.trim();
  return trimmed || DEFAULT_ELEVENLABS_AUDIO_MODEL;
}

export async function transcribeElevenLabsAudio(
  params: AudioTranscriptionRequest,
): Promise<AudioTranscriptionResult> {
  const fetchFn = params.fetchFn ?? fetch;
  const baseUrl = normalizeBaseUrl(params.baseUrl, DEFAULT_ELEVENLABS_AUDIO_BASE_URL);
  const allowPrivate = Boolean(params.baseUrl?.trim());
  const url = `${baseUrl}/speech-to-text`;

  const model = resolveModel(params.model);
  const form = new FormData();
  const fileName = params.fileName?.trim() || path.basename(params.fileName) || "audio";
  const bytes = new Uint8Array(params.buffer);
  const blob = new Blob([bytes], {
    type: params.mime ?? "application/octet-stream",
  });
  form.append("file", blob, fileName);
  form.append("model_id", model);
  if (params.language?.trim()) {
    // ElevenLabs might use different field names or not support it via this endpoint
    // but we add it if they do.
    form.append("language_code", params.language.trim());
  }

  const headers = new Headers(params.headers);
  headers.set("xi-api-key", params.apiKey);

  const { response: res, release } = await postTranscriptionRequest({
    url,
    headers,
    body: form,
    timeoutMs: params.timeoutMs,
    fetchFn,
    allowPrivateNetwork: allowPrivate,
  });

  try {
    await assertOkOrThrowHttpError(res, "ElevenLabs audio transcription failed");

    const payload = (await res.json()) as { text?: string };
    const text = requireTranscriptionText(
      payload.text,
      "ElevenLabs transcription response missing text",
    );
    return { text, model };
  } finally {
    await release();
  }
}
