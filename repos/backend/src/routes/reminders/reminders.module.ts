import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { OcrService } from 'src/services/ocr.service';
import { LlmService } from 'src/services/llm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BullModule } from '@nestjs/bullmq';
import { RemindersProcessor } from './reminders.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'quick-reminders',
    }),
  ],
  controllers: [RemindersController],
  providers: [
    RemindersService,
    RemindersProcessor,
    OcrService,
    LlmService,
    NotificationsService,
  ],
})
export class RemindersModule {}
