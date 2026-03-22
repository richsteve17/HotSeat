import { GoogleGenAI } from "@google/genai";
type RealtimeInput = Parameters<Awaited<ReturnType<GoogleGenAI['live']['connect']>>['sendRealtimeInput']>[0];
const x: RealtimeInput = { text: "test" };
const y: RealtimeInput = { text: { text: "test" } };
