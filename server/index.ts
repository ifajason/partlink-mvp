import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: '20mb' }));

  // === LINE OAuth API ===
  app.post('/api/auth/line', async (req: any, res: any) => {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      return res.status(400).json({ error: '缺少必要參數' });
    }
    try {
      const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINE_CHANNEL_ID || '2009895830',
          client_secret: process.env.LINE_CHANNEL_SECRET || '210fea6e14b22a304f38d90e9da11f2d',
        }).toString(),
      });
      const tokenData: any = await tokenRes.json();
      if (!tokenData.access_token) {
        return res.status(400).json({ error: 'LINE token交換失敗: ' + JSON.stringify(tokenData) });
      }
      const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile: any = await profileRes.json();
      res.json({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'LINE登入失敗' });
    }
  });

  // Serve static files
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  const uploadsPath = path.resolve(__dirname, "..", "uploads");
  app.use("/uploads", express.static(uploadsPath, {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    }
  }));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
