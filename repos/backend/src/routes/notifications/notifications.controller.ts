import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Observable } from 'rxjs';
import {
  AuthInfo,
  type IAuthInfo,
} from 'src/decorators/auth/AuthInfo.decorator';

@Controller('/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('/channel')
  channel(
    @AuthInfo() authInfo: IAuthInfo,
  ): Observable<MessageEvent> {
    return this.notificationsService.getChannel(authInfo.sub);
  }
}
