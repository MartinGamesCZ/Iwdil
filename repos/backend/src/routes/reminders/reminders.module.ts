import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { OcrService } from 'src/services/ocr.service';
import { LlmService } from 'src/services/llm.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [],
  controllers: [RemindersController],
  providers: [RemindersService, OcrService, LlmService, NotificationsService],
})
export class RemindersModule {}
