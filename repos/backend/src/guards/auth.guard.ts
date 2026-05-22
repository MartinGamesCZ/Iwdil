import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserService } from 'src/services/user.service';
import { extractBearerTokenFromHeaders } from 'src/utils/bearer';
import { createAuthInfo, validateJwt } from 'src/utils/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isNoAuth = this.reflector.getAllAndOverride<boolean>('auth:no-auth', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isNoAuth) return true;

    const scopes = this.reflector.getAllAndOverride<string[]>('auth:scopes', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    try {
      const token = extractBearerTokenFromHeaders(request.headers);
      const payload = await validateJwt(token, scopes);

      request.auth = createAuthInfo(payload);

      await this.userService.postAuthenticate(payload.sub!);

      return true;
    } catch (err: any) {
      if (err.status === 401) throw new UnauthorizedException(err.message);

      throw new ForbiddenException(err.message);
    }
  }
}
