import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class AuditEntryEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 64,
  })
  action: string;

  @Column({
    type: 'text',
  })
  details: string;

  @CreateDateColumn()
  timestamp: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = randomUUID();
  }
}
