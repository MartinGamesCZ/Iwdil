import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { UserEntity } from './entities/UserEntity';
import { AuditEntryEntity } from './entities/AuditEntryEntity';
import { QuickReminderEntity } from './entities/QuickReminderEntity';
import { SearchSessionEntity } from './entities/SearchSessionEntity';
import { SearchMessageEntity } from './entities/SearchMessageEntity';
import { SearchDocumentEntity } from './entities/SearchDocumentEntity';

export class Database {
  static #ENTITIES: ObjectLiteral = [
    UserEntity,
    AuditEntryEntity,
    QuickReminderEntity,
    SearchSessionEntity,
    SearchMessageEntity,
    SearchDocumentEntity,
  ];

  static #datasource = new DataSource({
    type: 'postgres',
    host: 'timescale',
    port: 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: this.#ENTITIES,
    logging: false,
    synchronize: true,
  });

  static async initialize() {
    await this.#datasource.initialize();
  }

  static get<T extends ObjectLiteral>(): Repository<T> {
    // Injected by SWC transformer
    // @ts-ignore
    const entity = arguments[0] as EntityTarget<T>;

    if (!entity) throw new InternalServerErrorException('Entity not found');

    return this.#datasource.getRepository(entity);
  }
}
