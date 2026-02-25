import type { MediaUnderstandingProvider } from "../../types.js";
import { transcribeElevenLabsAudio } from "./audio.js";

export const elevenlabsProvider: MediaUnderstandingProvider = {
  id: "elevenlabs",
  capabilities: {
    transcribeAudio: true,
    transcribeVideo: false,
    analyzeImage: false,
    analyzeVideo: false,
  },
  transcribeAudio: transcribeElevenLabsAudio,
};
