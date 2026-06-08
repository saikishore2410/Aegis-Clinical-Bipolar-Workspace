import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Passive, doctor-deferring AI Chat API route
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, userPrompt } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ 
      error: "GEMINI_API_KEY is not configured in environment variables. Please check Settings > Secrets in AI Studio UI." 
    });
  }

  try {
    const formattedHistory = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }]
    }));

    // System instruction designed to force a completely passive stance, with doctor consultation warning
    const systemInstruction = 
      "You are Aegis AI, a completely passive, exceptionally gentle, and emotionally supportive companion for individuals managing bipolar disorder. " +
      "You NEVER offer suggestions, recommendations, advice, or lifestyle modifications spontaneously or unsolicited. You are there to gently listen and validate. " +
      "CRITICAL REQUIREMENT: If the user directly asks you for suggestions, solutions, coping strategies, diagnostic feedback, drug or medication advice, or anything health-related, you MUST ALWAYS start by instructing and reminding them to consult their doctor, professional psychiatrist, or healthcare team first. You can then provide standard, non-prescriptive psychiatric educational concepts or active-listening support. " +
      "Keep your formatting simple, clear, structured, and short. Speak with maximum gentleness, avoiding academic lectures or overwhelming paragraphs. Ensure your tone does not overstimulate or attract undue obsession.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error?.message || "Failed to communicate with AI Assistant." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
