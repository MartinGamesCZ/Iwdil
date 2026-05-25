import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';
import { NotificationManager } from 'src/classes/NotificationManager';

@Injectable()
export class NotificationsService {
  getChannel(userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((sub) => {
      NotificationManager.addSubscriber(userId, sub);

      sub.add(() => {
        NotificationManager.removeSubscriber(userId, sub);
      });
    });
  }

  async push(userId: string, event: MessageEvent) {
    console.log('Push notification to user', userId);

    NotificationManager.notifySubscribers(userId, event);
  }
}
