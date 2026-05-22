import { IncomingHttpHeaders } from 'http';

export const JWKS_URI = 'https://lto.martinpetr.dev/oidc/jwks';
export const ISSUER = 'https://lto.martinpetr.dev/oidc';

export class AuthInfo {
  constructor(
    public sub: string,
    public clientId?: string,
    public organizationId?: string,
    public scopes: string[] = [],
    public audience: string[] = [],
  ) {}
}

export class AuthorizationError extends Error {
  name = 'AuthorizationError';

  constructor(
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}

export function extractBearerTokenFromHeaders({
  authorization,
}: IncomingHttpHeaders): string {
  const bearerPrefix = 'Bearer ';

  if (!authorization)
    throw new AuthorizationError('Authorization header is missing', 401);

  if (!authorization.startsWith(bearerPrefix))
    throw new AuthorizationError(
      `Authorization header must start with "${bearerPrefix}"`,
      401,
    );

  return authorization.slice(bearerPrefix.length);
}
