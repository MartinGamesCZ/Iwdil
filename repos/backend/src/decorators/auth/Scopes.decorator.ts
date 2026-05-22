import { applyDecorators, SetMetadata } from '@nestjs/common';

export function Scopes(...scopes: string[]) {
  return applyDecorators(SetMetadata('auth:scopes', scopes));
}
