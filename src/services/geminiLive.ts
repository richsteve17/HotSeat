import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

export interface LiveSessionConfig {
  systemInstruction: string;
  onMessage: (message: LiveServerMessage) => void;
  onClose: () => void;
  onError: (error: any) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async connect(config: LiveSessionConfig) {
    this.session = await this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: config.systemInstruction,
      },
      callbacks: {
        onopen: () => console.log("Live session opened"),
        onmessage: config.onMessage,
        onclose: config.onClose,
        onerror: config.onError,
      },
    });
    return this.session;
  }

  async sendAudio(base64Data: string) {
    if (this.session) {
      await this.session.sendRealtimeInput({
        audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
      });
    }
  }

  async sendText(text: string) {
    if (this.session) {
      await this.session.sendRealtimeInput({ text });
    }
  }

  close() {
    if (this.session) {
      this.session.close();
    }
  }
}
