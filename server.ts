import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Proxy Route to bypass regional blocks (e.g. in China)
  app.all("/api/gemini-proxy/*", async (req, res) => {
    try {
      const targetPath = req.params[0] || "";
      const queryParams = new URLSearchParams(req.query as any);
      
      // Use the server-side API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        queryParams.set("key", apiKey);
      }

      const url = `https://generativelanguage.googleapis.com/${targetPath}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
