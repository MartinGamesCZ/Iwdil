import { IdTokenClaims } from "@logto/next";

export class AuthenticationManager {
  #claims: IdTokenClaims;

  constructor(claims: IdTokenClaims | undefined) {
    this.#claims = claims as IdTokenClaims;
  }

  get claims(): IdTokenClaims {
    return this.#claims;
  }
}
