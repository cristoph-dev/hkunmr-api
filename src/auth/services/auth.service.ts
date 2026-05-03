import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from 'src/users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OTPEnum } from '../types/otp-type.enum';
import * as bcrypt from 'bcrypt';
import { UserPayload } from 'src/common/lib/types';
import { Role, User } from 'src/users/entities';
import { LoginResponseDto } from '../dto/login-response.dto';
import { MeResponseDto } from '../dto/me-response.dto';
import { ConfigService } from '@nestjs/config';
import { EmailDomain } from 'src/common/lib/const';
import {
  RegistrationPayload,
  ResetPayload,
} from '../types/registration-payload.interface';
import { JwtPayload } from '../strategies/jwt.strategy';
// fix: registrarle su rol
import { AuthRole } from 'src/common/guards/role.guard';
//fix2: registrarle siempre el 1er curso 
import { Course, CourseScope } from 'src/courses/entities/course.entity';
import { UserCourse } from 'src/courses/entities/course-user.entity';
import { Lesson } from 'src/courses/entities/lesson.entity';
import { UserLesson } from 'src/courses/entities/lesson-user.entity';
import { UserStep } from 'src/courses/entities/lesson-step-user.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { Classroom } from 'src/classroom/entities/classroom.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private async generateTokens(
    payload: UserPayload,
  ): Promise<LoginResponseDto> {
    const jwtPayload: JwtPayload = {
      sub: payload.id,
      email: payload.email,
      roles: payload.roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: '8d',
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async generateRegistrationToken(
    payload: RegistrationPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '5m',
      secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
    });
  }

  private async generateResetToken(payload: ResetPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '5m',
      secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
    });
  }

  /**
   * Usado por LocalStrategy
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const passwordValid = await bcrypt.compare(password, user.password!);
    if (!passwordValid) {
      return null;
    }
    if (user.is_active === false || user.email_verified === false) {
      throw new BadRequestException('Email not verified');
    }

    if (!user.roles || user.roles.length === 0) {
      throw new UnauthorizedException('User has no roles assigned');
    }
    delete user.password;
    return user;
  }

  /**
   * Usado por AuthController después del guard
   */
  async login(user: User): Promise<LoginResponseDto> {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.description),
    };
    return this.generateTokens(payload);
  }

  private validateEmail(email: string): void {
    const allowNonUnimarEmails =
      this.configService.get<string>('ALLOW_NON_UNIMAR_EMAILS') === 'true';

    if (allowNonUnimarEmails) {
      return;
    }

    if (!email.endsWith('@' + EmailDomain)) {
      throw new BadRequestException(
        'El correo electrónico debe pertenecer al dominio @' + EmailDomain,
      );
    }
  }

  async register(
    name: string,
    lastname: string,
    email: string,
    password: string,
  ): Promise<{ registrationToken: string; expires: string }> {
    this.validateEmail(email);

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otpUuid = await this.otpService.sendOTP(email, OTPEnum.VERIFICATION);

    const registrationToken = await this.generateRegistrationToken({
      name,
      lastname,
      email,
      password: hashedPassword,
      otpUuid,
    });

    return { registrationToken, expires: '5m' };
  }

  async forgotPassword(
    email: string,
  ): Promise<{ resetToken: string; expires: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.validateEmail(email);

      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new BadRequestException();
      }

      const otpUuid = await this.otpService.sendOTP(
        email,
        OTPEnum.PASSWORD_CHANGE,
      );

      const resetToken = await this.generateResetToken({
        email,
        otpUuid,
      });

      await queryRunner.commitTransaction();

      return { resetToken, expires: '5m' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(
    resetToken: string,
    code: string,
    password: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let payload: ResetPayload;
      try {
        payload = await this.jwtService.verifyAsync(resetToken, {
          secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
        });
      } catch (e) {
        console.error(e);
        throw new BadRequestException('Invalid or expired reset token');
      }

      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new BadRequestException();
      }

      const isValid = await this.otpService.verifyOTPByUuid(
        payload.otpUuid,
        code,
        OTPEnum.PASSWORD_CHANGE,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid code');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.usersService.updatePassword(
        payload.email,
        hashedPassword,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyUser(code: string, registrationToken: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payload: RegistrationPayload = await this.jwtService.verifyAsync(
        registrationToken,
        {
          secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
        },
      );

      const isValid = await this.otpService.verifyOTPByUuid(
        payload.otpUuid,
        code,
        OTPEnum.VERIFICATION,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid code');
      }

    const existingUser = await this.usersService.findByEmail(payload.email);
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const user = await this.usersService.create( //Crear usuario
        {
          name: payload.name,
          lastname: payload.lastname,
          email: payload.email,
          password: payload.password,
          is_active: true,
          email_verified: true,
        },
        queryRunner.manager,
      );

      const roleRepository = queryRunner.manager.getRepository(Role); // Buscar rol Estudiante por defecto

      const defaultRole = await roleRepository.findOne({
        where: {
          description: AuthRole.Student,
          is_active: true,
        },
      });

      if (!defaultRole) {
        throw new BadRequestException('Default role not found');
      }

      await queryRunner.manager // Asignar rol al usuario
        .createQueryBuilder()
        .relation(User, 'roles')
        .of(user.id)
        .add(defaultRole.id);

      const courseRepository = queryRunner.manager.getRepository(Course); // Obtener todos los cursos activos con lecciones

      const activeCourses = await courseRepository.find({
        where: { is_active: true },
        relations: ['lessons'],
      });

      if (!activeCourses.length) {
        throw new BadRequestException('No active courses found');
      }

      const userCourseRepository =
        queryRunner.manager.getRepository(UserCourse);

      const userLessonRepository =
        queryRunner.manager.getRepository(UserLesson);

      let coursesToEnroll: Course[] = []; // Determinar cursos según rol

      if (defaultRole.description === AuthRole.Student) {
        const firstCourse = activeCourses.find(
          (c) => c.scope === CourseScope.NATIVE && c.position === 1,
        );
        if (firstCourse) {
          coursesToEnroll.push(firstCourse);
        }
      } else if (
        defaultRole.description === AuthRole.Teacher ||
        defaultRole.description === AuthRole.Admins
      ) {
        coursesToEnroll = activeCourses;
      }

      for (const course of coursesToEnroll) { // Inscribir al usuario en los cursos correspondientes
        const userCourse = await userCourseRepository.save({
          user: { id: user.id },
          course: { id: course.id },
          progress: ProgressEnum.IN_PROGRESS,
        });

        const lessonEnrollments = course.lessons.map((lesson, index) =>
          userLessonRepository.create({
            lesson: { id: lesson.id },
            course_user: { id: userCourse.id },
            progress:
              index === 0
                ? ProgressEnum.IN_PROGRESS
                : ProgressEnum.NOT_STARTED,
          }),
        );

        await userLessonRepository.save(lessonEnrollments);
      }

      await queryRunner.commitTransaction();
      return true;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(
    userId: number,
    _refreshToken: string,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.generateTokens({
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.description),
    });
  }

  async getMe(userId: number): Promise<MeResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user || user.is_active === false) {
      throw new UnauthorizedException();
    }

    const primaryRole = user.roles?.[0]?.description ?? '';
    const pointsQuery = this.dataSource
      .getRepository(UserStep)
      .createQueryBuilder('userStep')
      .innerJoin('userStep.user_lesson', 'userLesson')
      .innerJoin('userLesson.course_user', 'userCourse')
      .innerJoin('userCourse.course', 'course')
      .innerJoin('userCourse.user', 'user')
      .where('user.id = :userId', { userId });

    if (primaryRole === AuthRole.Student) {
      const activeClassroom = await this.dataSource
        .getRepository(Classroom)
        .createQueryBuilder('classroom')
        .leftJoinAndSelect('classroom.teacher', 'teacher')
        .innerJoin('classroom.students', 'student', 'student.id = :userId', {
          userId,
        })
        .where('classroom.is_active = :isActive', { isActive: true })
        .orderBy('classroom.created_at', 'ASC')
        .getOne();

      pointsQuery.andWhere(
        `(course.scope = :nativeScope OR course.author_id = :teacherId OR EXISTS (
          SELECT 1
          FROM classroom_courses cc
          WHERE cc.course_id = course.id
          AND cc.classroom_id = :classroomId
        ))`,
        {
          nativeScope: CourseScope.NATIVE,
          teacherId: activeClassroom?.teacher?.id ?? 0,
          classroomId: activeClassroom?.id ?? 0,
        },
      );
    }

    const pointsRow = await pointsQuery
      .select('COALESCE(SUM(userStep.medals_earned), 0)', 'points')
      .getRawOne<{ points: string | number }>();

    const points = Number(pointsRow?.points ?? 0);

    return {
      name: user.name,
      lastname: user.lastname,
      role: primaryRole,
      points,
      profile_image: user.profile_image ?? null,
    };
  }
}

