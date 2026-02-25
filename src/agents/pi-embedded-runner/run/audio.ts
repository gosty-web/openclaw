import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveUserPath } from "../../../utils.js";
import { loadWebMedia } from "../../../web/media.js";
import type { SandboxFsBridge } from "../../sandbox/fs-bridge.js";
import { log } from "../logger.js";

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  ".opus",
]);

export interface DetectedAudioRef {
  raw: string;
  type: "path" | "url";
  resolved: string;
}

function isAudioExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext);
}

export function detectAudioReferences(prompt: string): DetectedAudioRef[] {
  const refs: DetectedAudioRef[] = [];
  const seen = new Set<string>();

  const addPathRef = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) {
      return;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return;
    }
    if (!isAudioExtension(trimmed)) {
      return;
    }
    seen.add(trimmed.toLowerCase());
    const resolved = trimmed.startsWith("~") ? resolveUserPath(trimmed) : trimmed;
    refs.push({ raw: trimmed, type: "path", resolved });
  };

  const mediaAttachedPattern = /\[media attached(?:\s+\d+\/\d+)?:\s*([^\]]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = mediaAttachedPattern.exec(prompt)) !== null) {
    const content = match[1];
    const pathMatch = content.match(
      /^\s*(.+?\.(?:mp3|wav|ogg|m4a|aac|flac|opus))\s*(?:\(|$|\|)/i,
    );
    if (pathMatch?.[1]) {
      addPathRef(pathMatch[1].trim());
    }
  }

  return refs;
}

export async function loadAudioFromRef(
  ref: DetectedAudioRef,
  workspaceDir: string,
  options?: {
    maxBytes?: number;
    sandbox?: { root: string; bridge: SandboxFsBridge };
  },
): Promise<{ data: Buffer; mimeType: string } | null> {
  try {
    let targetPath = ref.resolved;

    if (ref.type === "url") {
      return null;
    }

    if (ref.type === "path") {
      if (options?.sandbox) {
        try {
          const resolved = options.sandbox.bridge.resolvePath({
            filePath: targetPath,
            cwd: options.sandbox.root,
          });
          targetPath = resolved.hostPath;
        } catch (err) {
          return null;
        }
      } else if (!path.isAbsolute(targetPath)) {
        targetPath = path.resolve(workspaceDir, targetPath);
      }
    }

    const media = options?.sandbox
      ? await loadWebMedia(targetPath, {
          maxBytes: options.maxBytes,
          sandboxValidated: true,
          readFile: (filePath) =>
            options.sandbox!.bridge.readFile({ filePath, cwd: options.sandbox!.root }),
        })
      : await loadWebMedia(targetPath, options?.maxBytes);

    if (media.kind !== "audio") {
      return null;
    }

    return { data: media.buffer, mimeType: media.contentType || "audio/wav" };
  } catch (err) {
    return null;
  }
}

export async function detectAndLoadPromptAudio(params: {
  prompt: string;
  workspaceDir: string;
  model: { provider: string };
  existingAudio?: Array<{ data: Buffer; mimeType: string }>;
  maxBytes?: number;
  sandbox?: { root: string; bridge: SandboxFsBridge };
}): Promise<{
  audio: Array<{ data: Buffer; mimeType: string }>;
}> {
  if (params.model.provider !== "google") {
    return { audio: [] };
  }

  const promptRefs = detectAudioReferences(params.prompt);
  const loadedAudio: Array<{ data: Buffer; mimeType: string }> = [...(params.existingAudio ?? [])];

  for (const ref of promptRefs) {
    const audio = await loadAudioFromRef(ref, params.workspaceDir, {
      maxBytes: params.maxBytes,
      sandbox: params.sandbox,
    });
    if (audio) {
      loadedAudio.push(audio);
    }
  }

  return { audio: loadedAudio };
}
