"use client";

import { AuthenticationManager } from "@/classes/AuthenticationManager";
import { IdTokenClaims } from "@logto/next";
import { createContext, ReactNode, useContext } from "react";

export const AuthenticationContext = createContext<AuthenticationManager>(
  new AuthenticationManager(undefined, undefined),
);

interface IAuthenticationProviderProps {
  children: ReactNode | ReactNode[];
  claims: IdTokenClaims;
  apiAccessToken: string;
}

export function AuthenticationProvider(props: IAuthenticationProviderProps) {
  const authManager = new AuthenticationManager(
    props.claims,
    props.apiAccessToken,
  );

  return (
    <AuthenticationContext.Provider value={authManager}>
      {props.children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication() {
  return useContext(AuthenticationContext);
}
