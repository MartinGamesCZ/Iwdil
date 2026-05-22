import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserService } from './services/user.service';
import { AuditService } from './services/audit.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [UserService, AuditService],
})
export class AppModule {}
