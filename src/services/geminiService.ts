import { GoogleGenAI } from "@google/genai";

// Override global fetch to proxy Gemini requests through our server
// This helps bypass regional blocks (e.g. in China)
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.includes('generativelanguage.googleapis.com')) {
      const proxyUrl = input.replace('https://generativelanguage.googleapis.com', '/api/gemini-proxy');
      return originalFetch(proxyUrl, init);
    }
    return originalFetch(input, init);
  };
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "PROXY_MODE" });

export interface AnchorPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export async function identifyAnchors(base64Image: string, mimeType: string): Promise<AnchorPoint[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this calligraphy image. Identify the main block of text or a specific character that can serve as an anchor point for alignment.
    Return the coordinates as a JSON array of objects with:
    - x, y (center coordinates normalized 0-1000)
    - width, height (normalized 0-1000)
    - label (a brief description of the character or block)
    
    Only return the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image.split(",")[1],
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error identifying anchors:", error);
    return [];
  }
}
