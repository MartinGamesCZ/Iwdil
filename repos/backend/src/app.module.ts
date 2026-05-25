import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { AuditService } from './services/audit.service';
import { RemindersModule } from './routes/reminders/reminders.module';
import { OcrService } from './services/ocr.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './routes/notifications/notifications.module';

@Module({
  imports: [RemindersModule, NotificationsModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [UserService, AuditService, OcrService],
})
export class AppModule {}
