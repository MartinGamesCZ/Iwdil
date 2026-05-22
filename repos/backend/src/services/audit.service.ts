import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/database';
import { AuditEntryEntity } from 'src/database/entities/AuditEntryEntity';
import { AuditAction } from 'src/types/audit';

@Injectable()
export class AuditService {
  async log(action: AuditAction, details: string) {
    const entry = new AuditEntryEntity();

    entry.action = action;
    entry.details = details;

    await Database.get<AuditEntryEntity>().save(entry);
  }
}
