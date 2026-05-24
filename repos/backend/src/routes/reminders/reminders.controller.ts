import { Body, Controller, Get, Post } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import {
  AuthInfo,
  type IAuthInfo,
} from '../../decorators/auth/AuthInfo.decorator';

@Controller('/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('/quick-create/snippet/upload')
  async quickCreateUpload(
    @AuthInfo() authInfo: IAuthInfo,
    @Body('size') size: string,
  ) {
    return this.remindersService.quickCreateUpload(authInfo.sub, size);
  }

  @Get('/quick-create/snippet/url')
  async getQuickCreateSnippetUrl(@AuthInfo() authInfo: IAuthInfo) {
    return this.remindersService.quickCreateGetSnippetUrl(authInfo.sub);
  }
}
