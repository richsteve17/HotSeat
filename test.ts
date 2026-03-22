import { GoogleGenAI } from "@google/genai";
type LiveConfig = Parameters<GoogleGenAI['live']['connect']>[0]['config'];
const x: LiveConfig = { systemInstruction: "test" };
