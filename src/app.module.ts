import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/modules/auth.module';
import { MailModule } from './mail/mail.module';

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
    UsersModule,
    AuthModule,
    MailModule,
  ],
})
export class AppModule {}
