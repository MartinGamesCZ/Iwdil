import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

export class Database {
  static #ENTITIES: ObjectLiteral = [];

  static #datasource = new DataSource({
    type: 'postgres',
    host: 'timescale',
    port: 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: this.#ENTITIES,
    logging: true,
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
