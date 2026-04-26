/**
 * 環境變數讀取與驗證
 *
 * 設計原則：
 * - 不再使用任何硬編碼 fallback（避免金鑰外洩 + fallback 到舊金鑰的雙重災難）
 * - 必要的金鑰若未設定，啟動時即拋錯（fail-fast）
 * - 非必要的設定（如 OAUTH_SERVER_URL）允許空字串
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[ENV] Required environment variable "${name}" is not set. ` +
        `Set it in Render → Environment Variables and redeploy.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const ENV = {
  // === 內部設定（非機密） ===
  appId: optionalEnv("VITE_APP_ID"),
  isProduction: process.env.NODE_ENV === "production",

  // === 認證相關（必填） ===
  cookieSecret: optionalEnv("JWT_SECRET"),
  databaseUrl: optionalEnv("DATABASE_URL"),
  oAuthServerUrl: optionalEnv("OAUTH_SERVER_URL"),
  ownerOpenId: optionalEnv("OWNER_OPEN_ID"),

  // === LINE Login（買賣家登入用） ===
  lineChannelId: optionalEnv("LINE_CHANNEL_ID"),
  lineChannelSecret: optionalEnv("LINE_CHANNEL_SECRET"),

  // === LINE Messaging API（推播用） ===
  lineMessagingChannelAccessToken: optionalEnv("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN"),
  lineOfficialAccountId: optionalEnv("LINE_OFFICIAL_ACCOUNT_ID"),

  // === Manus 平台舊有（保留向後相容，已不主要使用） ===
  forgeApiUrl: optionalEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: optionalEnv("BUILT_IN_FORGE_API_KEY"),
};

/**
 * 啟動時驗證 — 在 server/_core/index.ts 啟動時呼叫
 * 區分「啟動就掛掉」與「特定功能用到才報錯」
 */
export function validateRequiredEnv() {
  const missing: string[] = [];

  if (!ENV.databaseUrl) missing.push("DATABASE_URL");
  if (!ENV.cookieSecret) missing.push("JWT_SECRET");
  if (!ENV.lineChannelId) missing.push("LINE_CHANNEL_ID");
  if (!ENV.lineChannelSecret) missing.push("LINE_CHANNEL_SECRET");
  if (!ENV.lineMessagingChannelAccessToken)
    missing.push("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN");

  if (missing.length > 0) {
    console.error(
      `\n[ENV] FATAL: Missing required environment variables:\n  - ${missing.join("\n  - ")}\n` +
        `Set them in Render → Environment Variables and redeploy.\n`
    );
    // 在 production 直接 fail-fast；development 印警告但繼續
    if (ENV.isProduction) {
      throw new Error(`Missing required env: ${missing.join(", ")}`);
    }
  }
}

// requireEnv 暴露給外部需要嚴格檢查的場景使用
export { requireEnv };
