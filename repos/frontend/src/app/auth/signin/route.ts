import { signIn } from "@logto/next/server-actions";
import { logtoConfig } from "@/config/logto";

export async function GET() {
  await signIn(logtoConfig, `${logtoConfig.baseUrl}/auth/signin/callback`);
}
