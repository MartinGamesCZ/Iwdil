import { Controller, Get } from '@nestjs/common';
import { NoAuth } from './decorators/auth/NoAuth.decorator';
import { Scopes } from './decorators/auth/Scopes.decorator';
import { AuthInfo, type IAuthInfo } from './decorators/auth/AuthInfo.decorator';
import { Database } from './database/database';
import { UserEntity } from './database/entities/UserEntity';

@Controller()
export class AppController {
  constructor() {}

  @Get('/public')
  @NoAuth()
  public() {
    return 'public';
  }

  @Get('/protected')
  protected(@AuthInfo() info: IAuthInfo) {
    return {
      type: 'protected',
      info,
    };
  }

  @Get('/admin')
  @Scopes('api:admin')
  admin() {
    return 'admin';
  }

  @NoAuth()
  @Get('/db')
  async db() {
    return await Database.get<UserEntity>().find();
  }
}
