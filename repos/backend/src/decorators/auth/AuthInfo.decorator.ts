import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthInfo as AuthInfoClass } from '../../utils/bearer';

export type IAuthInfo = AuthInfoClass;

export const AuthInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return (request.auth as IAuthInfo) ?? {};
  },
);
