import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV, validateRequiredEnv } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

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

/**
 * LINE OAuth：通用買賣家登入流程
 * 前端傳 { code, redirectUri, role: 'buyer' | 'seller' }
 * 後端：(1) 換 LINE token (2) 取 LINE profile (3) upsert users 表
 *      (4) 建 session cookie (5) 回傳 lineUserId / displayName / pictureUrl / userId / role
 *
 * role 用途：未來可在 cookie 標記角色，做角色相關權限控制
 */
function registerLineAuthRoute(app: express.Express) {
  app.post("/api/auth/line", async (req: any, res: any) => {
    const { code, redirectUri, role } = req.body || {};
    if (!code || !redirectUri) {
      return res.status(400).json({ error: "缺少參數 code 或 redirectUri" });
    }
    if (!ENV.lineChannelId || !ENV.lineChannelSecret) {
      return res.status(500).json({
        error: "LINE Login channel 尚未設定（缺 LINE_CHANNEL_ID 或 LINE_CHANNEL_SECRET）",
      });
    }

    try {
      // 1. 用 code 換 access_token
      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: ENV.lineChannelId,
          client_secret: ENV.lineChannelSecret,
        }).toString(),
      });
      const tokenData: any = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("[LINE Auth] Token exchange failed:", tokenData);
        return res.status(400).json({
          error: "LINE token 交換失敗",
          detail: tokenData,
        });
      }

      // 2. 用 access_token 取 LINE profile
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile: any = await profileRes.json();
      if (!profile.userId) {
        console.error("[LINE Auth] Profile fetch failed:", profile);
        return res.status(400).json({ error: "無法取得 LINE profile", detail: profile });
      }

      // 3. upsert 到 users 表（openId 格式：line_<lineUserId>）
      const openId = `line_${profile.userId}`;
      const upserted = await db.upsertUser({
        openId,
        name: profile.displayName || null,
        loginMethod: "line",
        lastSignedIn: new Date(),
      });

      // 4. 建立 session cookie（用既有 SDK，沿用現有 JWT 流程）
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.displayName || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 5. 回傳給前端
      res.json({
        userId: upserted?.id,
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
        role: role || "unknown",
      });
    } catch (e: any) {
      // 詳細錯誤資訊（讓 Render log 看得到底層真正的 MySQL/network 錯誤）
      console.error("[LINE Auth] === ERROR DETAILS ===");
      console.error("[LINE Auth] message:", e?.message);
      console.error("[LINE Auth] code:", e?.code);
      console.error("[LINE Auth] cause:", e?.cause?.message || e?.cause);
      console.error("[LINE Auth] errno:", e?.errno);
      console.error("[LINE Auth] sqlState:", e?.sqlState);
      console.error("[LINE Auth] sqlMessage:", e?.sqlMessage);
      console.error("[LINE Auth] stack:", e?.stack);
      console.error("[LINE Auth] === END ERROR ===");
      res.status(500).json({
        error: e?.message || "LINE 登入失敗",
        // 把 MySQL 底層錯誤碼也回傳給前端方便除錯
        code: e?.code,
        sqlMessage: e?.sqlMessage,
      });
    }
  });
}

async function startServer() {
  // 啟動前驗證關鍵環境變數（缺就 fail-fast）
  validateRequiredEnv();

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback (Manus 平台原有的)
  registerOAuthRoutes(app);

  // LINE Login 統一路由（買賣家共用）
  registerLineAuthRoute(app);

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
    console.log(`[Server] Running on http://localhost:${port}/ (NODE_ENV=${process.env.NODE_ENV || "development"})`);
  });
}

startServer().catch(err => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
