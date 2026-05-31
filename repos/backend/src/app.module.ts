import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { AuditService } from './services/audit.service';
import { RemindersModule } from './routes/reminders/reminders.module';
import { OcrService } from './services/ocr.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './routes/notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { SearchModule } from './routes/search/search.module';

@Module({
  imports: [
    RemindersModule,
    NotificationsModule,
    SearchModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'redis',
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [],
  providers: [UserService, AuditService, OcrService],
})
export class AppModule {}
