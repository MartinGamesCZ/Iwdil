import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { AuthInfo, AuthorizationError, ISSUER, JWKS_URI } from './bearer';

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export async function validateJwt(
  token: string,
  requiredScopes: string[],
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: ISSUER,
  });

  verifyPayload(payload, ['api:access', ...(requiredScopes ?? [])]);
  return payload;
}

export function createAuthInfo(payload: JWTPayload): AuthInfo {
  const scopes = (payload.scope as string)?.split(' ') ?? [];
  const audience = Array.isArray(payload.aud)
    ? payload.aud
    : payload.aud
      ? [payload.aud]
      : [];

  return new AuthInfo(
    payload.sub!,
    payload.client_id as string,
    payload.organization_id as string,
    scopes,
    audience,
  );
}

function verifyPayload(payload: JWTPayload, requiredScopes?: string[]): void {
  const audiences = Array.isArray(payload.aud)
    ? payload.aud
    : payload.aud
      ? [payload.aud]
      : [];

  if (!audiences.includes('http://localhost:3001'))
    throw new AuthorizationError('Invalid audience');

  const scopes = (payload.scope as string)?.split(' ') ?? [];
  if (
    requiredScopes &&
    !requiredScopes.every((scope) => scopes.includes(scope))
  )
    throw new AuthorizationError('Insufficient scope');
}
