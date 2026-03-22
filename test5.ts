import { GoogleGenAI } from "@google/genai";
type ClientContent = Parameters<Awaited<ReturnType<GoogleGenAI['live']['connect']>>['sendClientContent']>[0];
const x: ClientContent = { turnComplete: true };
