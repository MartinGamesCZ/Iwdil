import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { AuditService } from './services/audit.service';
import { RemindersModule } from './routes/reminders/reminders.module';

@Module({
  imports: [RemindersModule],
  controllers: [],
  providers: [UserService, AuditService],
})
export class AppModule {}
