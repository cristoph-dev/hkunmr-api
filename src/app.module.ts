import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from './mail/mail.module';
import { CoursesModule } from './courses/course.module';
import { ClassroomModule } from './classroom/classroom.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from './common/guards/role.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      // carga las variables de entorno, y con isglobal se carga en toda la app
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      // Configuracion de typeorm
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('MYSQL_HOST'),
        port: Number(config.get('MYSQL_PORT')),
        username: config.get('MYSQL_USER'),
        password: config.get('MYSQL_PASS'),
        database: config.get('MYSQL_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get('ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    ClassroomModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
