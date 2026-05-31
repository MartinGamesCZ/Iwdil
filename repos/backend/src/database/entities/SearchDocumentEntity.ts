import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { SearchSessionEntity } from './SearchSessionEntity';
import { randomUUID } from 'crypto';

@Entity()
export class SearchDocumentEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 36,
  })
  id: string;

  @ManyToOne(() => SearchSessionEntity, (session) => session.documents, {
    onDelete: 'CASCADE',
  })
  session: Relation<SearchSessionEntity>;

  @Column()
  url: string;

  @Column({
    type: 'text',
  })
  chunk: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @BeforeInsert()
  onBeforeInsert(): void {
    if (!this.id) this.id = randomUUID();
  }
}
