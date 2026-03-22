import { GoogleGenAI } from "@google/genai";
type Session = Awaited<ReturnType<GoogleGenAI['live']['connect']>>;
type Methods = keyof Session;
const x: Methods = "sendClientContent";
