// index.ts
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupSocket } from "./socket.js";
import { registerRoutes } from "./routes";
// Vite integration removed for production deployment

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? ["https://your-vercel-app-url.vercel.app"] 
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
});

setupSocket(io);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(app);

  // Production mode - API only (frontend deployed separately to Vercel)
  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
})();
