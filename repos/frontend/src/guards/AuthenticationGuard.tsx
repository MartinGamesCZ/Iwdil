import { ErrorScreen } from "@/components/screens/ErrorScreen";
import { logtoConfig } from "@/config/logto";
import { AuthenticationProvider } from "@/context/AuthenticationContext";
import { getAccessTokenRSC, getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface IAuthenticationGuardProps {
  children: ReactNode | ReactNode[];
}

export async function AuthenticationGuard(props: IAuthenticationGuardProps) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) redirect("/auth/signin");
  if (!claims)
    return (
      <ErrorScreen
        component="authentication:lto:claims"
        message={"Failed to obtain user claims"}
      />
    );

  const apiAccessToken = await getAccessTokenRSC(
    logtoConfig,
    process.env.LOGTO_API_RESOURCE || "http://localhost:3001",
  );

  return (
    <AuthenticationProvider
      claims={JSON.parse(JSON.stringify(claims))}
      apiAccessToken={apiAccessToken}
    >
      {props.children}
    </AuthenticationProvider>
  );
}
