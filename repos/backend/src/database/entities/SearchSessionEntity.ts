import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './UserEntity';
import { SearchMessageEntity } from './SearchMessageEntity';
import { ESearchSessionState } from 'src/types/search';
import { SearchDocumentEntity } from './SearchDocumentEntity';

@Entity()
export class SearchSessionEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
  })
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @OneToMany(() => SearchMessageEntity, (message) => message.session)
  messages: Relation<SearchMessageEntity[]>;

  @OneToMany(() => SearchDocumentEntity, (document) => document.session)
  documents: Relation<SearchDocumentEntity[]>;

  @Column({
    type: 'enum',
    enum: ESearchSessionState,
    default: ESearchSessionState.Queued,
  })
  state: ESearchSessionState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @BeforeInsert()
  onBeforeInsert(): void {
    if (!this.id) this.id = randomUUID();
    if (!this.messages) this.messages = [];
    if (!this.documents) this.documents = [];
  }
}
