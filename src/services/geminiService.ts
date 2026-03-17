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
    Analyze this calligraphy image. Your goal is to identify the precise bounding box of the main character.
    
    Return the coordinates of the character's outer boundaries:
    - ymin, xmin, ymax, xmax (normalized 0-1000, where 0,0 is top-left and 1000,1000 is bottom-right)
    
    The bounding box should tightly enclose all ink/strokes of the character.
    
    Return the coordinates as a JSON object.
    
    Example output: {
      "ymin": 200,
      "xmin": 300,
      "ymax": 800,
      "xmax": 700
    }
    
    Only return the JSON object. No other text.
  `;

  try {
    const url = `/api/gemini-proxy/v1beta/models/${model}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) return [];
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?|```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error identifying anchors:", error);
    return [];
  }
}
