"use client";

import { AuthenticationManager } from "@/classes/AuthenticationManager";
import { IdTokenClaims } from "@logto/next";
import { createContext, ReactNode, useContext } from "react";

export const AuthenticationContext = createContext<AuthenticationManager>(
  new AuthenticationManager(undefined),
);

interface IAuthenticationProviderProps {
  children: ReactNode | ReactNode[];
  claims: IdTokenClaims;
}

export function AuthenticationProvider(props: IAuthenticationProviderProps) {
  const authManager = new AuthenticationManager(props.claims);

  return (
    <AuthenticationContext.Provider value={authManager}>
      {props.children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication() {
  return useContext(AuthenticationContext);
}
