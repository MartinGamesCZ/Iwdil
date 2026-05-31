import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { SearchService } from './search.service';
import {
  AuthInfo,
  type IAuthInfo,
} from 'src/decorators/auth/AuthInfo.decorator';
import { Observable } from 'rxjs';

@Controller('/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async createSession(
    @AuthInfo() auth: IAuthInfo,
    @Body('query') query: string,
  ) {
    return await this.searchService.createSession(auth, query);
  }

  @Get('/:sessionId')
  async getSession(
    @AuthInfo() auth: IAuthInfo,
    @Param('sessionId') sessionId: string,
  ) {
    return await this.searchService.getSession(auth, sessionId);
  }

  @Sse('/:sessionId/channel')
  async channel(
    @AuthInfo() authInfo: IAuthInfo,
    @Param('sessionId') sessionId: string,
  ): Promise<Observable<MessageEvent>> {
    return await this.searchService.getChannel(authInfo, sessionId);
  }
}
