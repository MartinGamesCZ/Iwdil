import { MessageEvent } from '@nestjs/common';
import { Subscriber } from 'rxjs';

export class NotificationManager {
  static #subscribers: {
    [userId: string]: Subscriber<MessageEvent>[];
  } = {};

  public static addSubscriber(
    userId: string,
    subscriber: Subscriber<MessageEvent>,
  ) {
    if (!this.#subscribers[userId]) this.#subscribers[userId] = [];

    this.#subscribers[userId].push(subscriber);
  }

  public static removeSubscriber(
    userId: string,
    subscriber: Subscriber<MessageEvent>,
  ) {
    this.#subscribers[userId] = this.#subscribers[userId].filter(
      (sub) => sub !== subscriber,
    );
  }

  public static notifySubscribers(userId: string, event: MessageEvent) {
    this.#subscribers[userId]?.forEach((sub) => sub.next(event));
  }
}
