import { applyDecorators, SetMetadata } from '@nestjs/common';

export function NoAuth() {
  return applyDecorators(SetMetadata('auth:no-auth', true));
}
