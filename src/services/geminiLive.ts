import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

export interface LiveSessionConfig {
  systemInstruction: string;
  onMessage: (message: LiveServerMessage) => void;
  onClose: () => void;
  onError: (error: any) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async connect(config: LiveSessionConfig) {
    console.log("Attempting to connect to live session...");
    const session = await this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: config.systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: { disabled: true }
        }
      },
      callbacks: {
        onopen: () => console.log("Live session opened"),
        onmessage: (msg) => {
          console.log("Message received");
          config.onMessage(msg);
        },
        onclose: () => {
          console.log("Live session closed");
          config.onClose();
        },
        onerror: (err) => {
          console.error("Live Error:", err);
          config.onError(err);
        },
      },
    });
    console.log("Connected to live session");
    this.session = session;
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

  async sendTurnComplete() {
    if (this.session) {
      await this.session.sendRealtimeInput({ text: "System: The user has finished speaking. Please respond." });
    }
  }

  close() {
    if (this.session) {
      this.session.close();
    }
  }
}
