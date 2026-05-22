import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from './audit.service';
import { UserEntity } from 'src/database/entities/UserEntity';
import { Database } from 'src/database/database';
import { AuditAction } from 'src/types/audit';

@Injectable()
export class UserService {
  constructor(private readonly auditService: AuditService) {}

  async postAuthenticate(sub: string) {
    if (!sub) throw new BadRequestException('Invalid claims sub field');

    const existingUser = await this.getById(sub);
    if (existingUser) return;

    const newUser = new UserEntity();

    newUser.id = sub;

    await Database.get<UserEntity>().save(newUser);
    await this.auditService.log(AuditAction.AuthNewUser, sub);
  }

  async getById(id: string): Promise<UserEntity | null> {
    if (!id) return null;

    const user = await Database.get<UserEntity>().findOne({
      where: {
        id: id,
      },
    });

    return user;
  }
}
