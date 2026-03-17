import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
