import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthGuard } from './guards/auth.guard';
import { Database } from './database/database';
import { UserService } from './services/user.service';

async function bootstrap() {
  await Database.initialize();

  const app = await NestFactory.create(AppModule);

  app.enableCors('*');

  const reflector = app.get(Reflector);
  const userService = app.get(UserService);
  app.useGlobalGuards(new AuthGuard(reflector, userService));

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
