import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // LINE Messaging API - 發送詢價通知給賣家
  app.post("/api/notify/inquiry", async (req: any, res: any) => {
    const { sellerLineUserId, buyerName, buyerContact, buyerQuestion, partName, partBrand } = req.body;
    if (!sellerLineUserId) return res.status(400).json({ error: "缺少賣家LINE ID" });
    const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
    const message = `🔔 新詢價通知！\n\n商品：${partBrand||""} ${partName||""}\n買家：${buyerName}\n聯絡：${buyerContact}\n${buyerQuestion?"問題："+buyerQuestion:""}\n\n請盡快回覆！`;
    try {
      const r = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
        body: JSON.stringify({ to: sellerLineUserId, messages: [{ type: "text", text: message }] }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(400).json({ error: JSON.stringify(data) });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // LINE OAuth API
  app.post("/api/auth/line", async (req: any, res: any) => {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) return res.status(400).json({ error: "缺少參數" });
    try {
      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: "2009895830", client_secret: "210fea6e14b22a304f38d90e9da11f2d" }).toString(),
      });
      const tokenData: any = await tokenRes.json();
      if (!tokenData.access_token) return res.status(400).json({ error: JSON.stringify(tokenData) });
      const profileRes = await fetch("https://api.line.me/v2/profile", { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
      const profile: any = await profileRes.json();
      res.json({ lineUserId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl || null });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
