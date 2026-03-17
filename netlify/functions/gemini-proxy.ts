import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  try {
    const path = event.path.replace("/api/gemini-proxy/", "");
    const queryParams = new URLSearchParams(event.queryStringParameters as any);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      queryParams.set("key", apiKey);
    }

    const url = `https://generativelanguage.googleapis.com/${path}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        "Content-Type": "application/json",
      },
      body: ["GET", "HEAD"].includes(event.httpMethod) ? undefined : event.body,
    });

    const data = await response.json();
    
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTION",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
