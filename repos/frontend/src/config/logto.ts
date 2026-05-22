import { LogtoNextConfig } from "@logto/next";

export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.LOGTO_ENDPOINT || "https://lto.martinpetr.dev/",
  appId: process.env.LOGTO_APP_ID || "",
  appSecret: process.env.LOGTO_APP_SECRET || "",
  baseUrl: process.env.APP_URL || "http://localhost:3000",
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || "",
  cookieSecure: process.env.NODE_ENV === "production",
};
