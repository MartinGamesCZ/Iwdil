import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './UserEntity';
import { ReminderStatus } from 'src/types/reminder';

@Entity()
export class QuickReminderEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
  })
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @Column({
    type: 'text',
  })
  extractedText: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  userGivenWhen: string;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.ScheduledForProcessing,
  })
  status: ReminderStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  inferedText: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  inferedWhen: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
