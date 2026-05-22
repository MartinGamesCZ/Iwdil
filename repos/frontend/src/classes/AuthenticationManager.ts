import { logtoConfig } from "@/config/logto";
import { IdTokenClaims } from "@logto/next";
import { getAccessToken } from "@logto/next/server-actions";

export class AuthenticationManager {
  #claims: IdTokenClaims;
  #apiAccessToken: string;

  constructor(
    claims: IdTokenClaims | undefined,
    apiAccessToken: string | undefined,
  ) {
    this.#claims = claims as IdTokenClaims;
    this.#apiAccessToken = apiAccessToken as string;
  }

  get claims(): IdTokenClaims {
    return this.#claims;
  }

  get apiAccessToken(): string {
    return this.#apiAccessToken;
  }
}
