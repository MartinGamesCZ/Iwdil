import { ErrorScreen } from "@/components/screens/ErrorScreen";
import { logtoConfig } from "@/config/logto";
import { AuthenticationProvider } from "@/context/AuthenticationContext";
import { getLogtoContext } from "@logto/next/server-actions";
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

  return (
    <AuthenticationProvider claims={claims}>
      {props.children}
    </AuthenticationProvider>
  );
}
