import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { SearchSessionEntity } from './SearchSessionEntity';

@Entity()
export class SearchMessageEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
  })
  id: string;

  @ManyToOne(() => SearchSessionEntity, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  session: Relation<SearchSessionEntity>;

  @Column({
    type: 'enum',
    enum: ['user', 'assistant', 'system'],
  })
  role: 'user' | 'assistant' | 'system';

  @Column({
    type: 'text',
  })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @BeforeInsert()
  onBeforeInsert(): void {
    if (!this.id) this.id = randomUUID();
  }
}
