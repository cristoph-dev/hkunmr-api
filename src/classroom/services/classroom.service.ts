import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Classroom } from '../entities/classroom.entity';
import { User } from 'src/users/entities';
import { CreateClassroomDto } from '../dto/create-classroom.dto';
import { AssignClassroomStudentsDto } from '../dto/assign-classroom-students.dto';
import { UpdateClassroomDto } from '../dto/update-classroom.dto';
import { AuthRole } from 'src/common/guards/role.guard';
import type { UserPayload } from 'src/common/lib/types';
import { CourseScope } from 'src/courses/entities/course.entity';

interface ClassroomListItem {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  teacher: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    profile_image: string | null;
  } | null;
  students_count: number;
}

interface ClassroomMembersResponse {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  teacher: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    profile_image: string | null;
  } | null;
  classmates: Array<{
    id: number;
    name: string;
    lastname: string;
    email: string;
    profile_image: string | null;
  }>;
}

interface ClassroomPodiumEntry {
  rank: number;
  student_id: number;
  name: string;
  lastname: string;
  email: string;
  profile_image: string | null;
  medals: number;
}

interface ClassroomPodiumResponse {
  classroom_id: number;
  classroom_name: string;
  classroom_code: string;
  entries: ClassroomPodiumEntry[];
}

@Injectable()
export class ClassroomService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createByTeacher(
    user: UserPayload,
    payload: CreateClassroomDto,
  ): Promise<ClassroomListItem> {
    const teacher = await this.userRepository.findOne({
      where: { id: user.id, is_active: true },
      relations: { roles: true },
    });

    if (!teacher) {
      throw new BadRequestException('Only teachers/admins can create classrooms');
    }

    const isTeacher = this.hasRole(teacher.roles, AuthRole.Teacher);
    const isAdmin = this.hasRole(teacher.roles, AuthRole.Admins);
    if (!isTeacher && !isAdmin) {
      throw new BadRequestException('Only teachers/admins can create classrooms');
    }

    const classroomCode = await this.resolveClassroomCode(payload.code);
    const classroomStudents = await this.getEligibleStudentsOrFail(
      payload.student_ids ?? [],
    );

    const classroom = this.classroomRepository.create({
      name: payload.name.trim(),
      code: classroomCode,
      teacher: { id: teacher.id },
      students: classroomStudents,
      is_active: true,
    });

    const saved = await this.classroomRepository.save(classroom);
    return this.toClassroomListItem(saved, teacher, classroomStudents.length);
  }

  async listMine(user: UserPayload): Promise<ClassroomListItem[]> {
    const isAdmin = user.roles.includes(AuthRole.Admins);
    const isTeacher = user.roles.includes(AuthRole.Teacher);
    const isStudent = user.roles.includes(AuthRole.Student);

    const qb = this.classroomRepository
      .createQueryBuilder('classroom')
      .leftJoinAndSelect('classroom.teacher', 'teacher')
      .leftJoinAndSelect('classroom.students', 'student')
      .orderBy('classroom.created_at', 'DESC');

    if (!isAdmin) {
      if (isTeacher) {
        qb.andWhere('teacher.id = :userId', { userId: user.id });
      } else if (isStudent) {
        qb.andWhere('student.id = :userId', { userId: user.id });
      } else {
        return [];
      }
    }

    const classrooms = await qb.getMany();

    return classrooms.map((classroom) =>
      this.toClassroomListItem(
        classroom,
        classroom.teacher,
        classroom.students?.length ?? 0,
      ),
    );
  }

  async updateClassroom(
    classroomId: number,
    payload: UpdateClassroomDto,
    user: UserPayload,
  ): Promise<ClassroomMembersResponse> {
    const classroom = await this.getClassroomWithMembersOrFail(classroomId, true);
    this.assertCanManageClassroom(classroom, user);

    if (payload.name !== undefined) {
      const trimmedName = payload.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Classroom name is required');
      }
      classroom.name = trimmedName;
    }

    if (payload.code !== undefined) {
      classroom.code = await this.resolveClassroomCodeForUpdate(
        classroom.id,
        payload.code,
      );
    }

    if (payload.teacher_id === null) {
      classroom.teacher = null;
    } else if (payload.teacher_id !== undefined) {
      classroom.teacher = await this.getEligibleTeacherOrFail(payload.teacher_id);
    }

    if (payload.student_ids !== undefined) {
      classroom.students = await this.getEligibleStudentsOrFail(payload.student_ids);
    }

    if (typeof payload.is_active === 'boolean') {
      classroom.is_active = payload.is_active;
    }

    const saved = await this.classroomRepository.save(classroom);
    return this.toClassroomMembers(saved);
  }

  async addStudents(
    classroomId: number,
    payload: AssignClassroomStudentsDto,
    user: UserPayload,
  ): Promise<ClassroomMembersResponse> {
    const classroom = await this.getClassroomWithMembersOrFail(classroomId);
    this.assertCanManageClassroom(classroom, user);

    const incomingStudents = await this.getEligibleStudentsOrFail(
      payload.student_ids,
    );
    const merged = new Map<number, User>();

    for (const student of classroom.students ?? []) {
      merged.set(student.id, student);
    }

    for (const student of incomingStudents) {
      merged.set(student.id, student);
    }

    classroom.students = Array.from(merged.values());
    const saved = await this.classroomRepository.save(classroom);
    return this.toClassroomMembers(saved);
  }

  async removeStudent(
    classroomId: number,
    studentId: number,
    user: UserPayload,
  ): Promise<ClassroomMembersResponse> {
    const classroom = await this.getClassroomWithMembersOrFail(classroomId);
    this.assertCanManageClassroom(classroom, user);

    const existingCount = classroom.students?.length ?? 0;
    classroom.students = (classroom.students ?? []).filter(
      (student) => student.id !== studentId,
    );

    if (classroom.students.length === existingCount) {
      throw new NotFoundException('Student is not part of this classroom');
    }

    const saved = await this.classroomRepository.save(classroom);
    return this.toClassroomMembers(saved);
  }

  async deleteClassroom(
    classroomId: number,
    user: UserPayload,
  ): Promise<{ success: boolean }> {
    const classroom = await this.getClassroomWithMembersOrFail(classroomId, true);
    this.assertCanManageClassroom(classroom, user);
    await this.classroomRepository.remove(classroom);

    return { success: true };
  }

  async getMembers(
    classroomId: number,
    user: UserPayload,
  ): Promise<ClassroomMembersResponse> {
    const classroom = await this.getClassroomWithMembersOrFail(classroomId);
    this.assertCanViewClassroom(classroom, user);
    return this.toClassroomMembers(classroom);
  }

  async getPodium(
    classroomId: number,
    user: UserPayload,
  ): Promise<ClassroomPodiumResponse> {
    const classroom = await this.getClassroomWithMembersOrFail(classroomId);
    this.assertCanViewClassroom(classroom, user);

    const rows = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.classrooms', 'classroom', 'classroom.id = :classroomId', {
        classroomId,
      })
      .innerJoin('user.roles', 'role')
      .leftJoin('user.courses', 'userCourse')
      .leftJoin('userCourse.course', 'course')
      .leftJoin('userCourse.user_lessons', 'userLesson')
      .leftJoin('userLesson.user_steps', 'userStep')
      .where('user.is_active = :isActive', { isActive: true })
      .andWhere('role.is_active = :roleActive', { roleActive: true })
      .andWhere('role.description = :studentRole', {
        studentRole: AuthRole.Student,
      })
      .andWhere(
        `(course.id IS NULL OR course.scope = :nativeScope OR course.author_id = :teacherId OR EXISTS (
          SELECT 1
          FROM classroom_courses cc
          WHERE cc.course_id = course.id
          AND cc.classroom_id = :classroomId
        ))`,
        {
          nativeScope: CourseScope.NATIVE,
          teacherId: classroom.teacher?.id ?? 0,
          classroomId,
        },
      )
      .select('user.id', 'student_id')
      .addSelect('user.name', 'name')
      .addSelect('user.lastname', 'lastname')
      .addSelect('user.email', 'email')
      .addSelect('user.profile_image', 'profile_image')
      .addSelect('COALESCE(SUM(userStep.medals_earned), 0)', 'medals')
      .groupBy('user.id')
      .orderBy('medals', 'DESC')
      .addOrderBy('user.name', 'ASC')
      .addOrderBy('user.lastname', 'ASC')
      .getRawMany<{
        student_id: string;
        name: string;
        lastname: string;
        email: string;
        profile_image: string | null;
        medals: string;
      }>();

    let currentRank = 0;
    let lastMedals: number | null = null;
    const entries: ClassroomPodiumEntry[] = rows.map((row, index) => {
      const medals = Number(row.medals);

      if (lastMedals === null || medals < lastMedals) {
        currentRank = index + 1;
      }
      lastMedals = medals;

      return {
        rank: currentRank,
        student_id: Number(row.student_id),
        name: row.name,
        lastname: row.lastname,
        email: row.email,
        profile_image: row.profile_image ?? null,
        medals,
      };
    });

    return {
      classroom_id: classroom.id,
      classroom_name: classroom.name,
      classroom_code: classroom.code,
      entries,
    };
  }

  private hasRole(roles: Array<{ description: string }>, role: AuthRole): boolean {
    return roles.some((item) => item.description === role);
  }

  private async resolveClassroomCode(code?: string): Promise<string> {
    const trimmed = code?.trim().toUpperCase();
    if (trimmed) {
      const existing = await this.classroomRepository.findOne({
        where: { code: trimmed },
      });
      if (existing) {
        throw new BadRequestException('Classroom code already exists');
      }
      return trimmed;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const generated = `CLS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const existing = await this.classroomRepository.findOne({
        where: { code: generated },
      });
      if (!existing) {
        return generated;
      }
    }

    throw new BadRequestException('Unable to generate a unique classroom code');
  }

  private async resolveClassroomCodeForUpdate(
    classroomId: number,
    code: string,
  ): Promise<string> {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      throw new BadRequestException('Classroom code is required');
    }

    const existing = await this.classroomRepository.findOne({
      where: { code: trimmed },
    });

    if (existing && existing.id !== classroomId) {
      throw new BadRequestException('Classroom code already exists');
    }

    return trimmed;
  }

  private async getEligibleStudentsOrFail(studentIds: number[]): Promise<User[]> {
    if (studentIds.length === 0) {
      return [];
    }

    const students = await this.userRepository.find({
      where: {
        id: In(studentIds),
        is_active: true,
        roles: { description: AuthRole.Student, is_active: true },
      },
      relations: { roles: true },
    });

    if (students.length !== studentIds.length) {
      const foundIds = new Set(students.map((student) => student.id));
      const missing = studentIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Some students are not eligible or do not exist: ${missing.join(', ')}`,
      );
    }

    return students;
  }

  private async getEligibleTeacherOrFail(teacherId: number): Promise<User> {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, is_active: true },
      relations: { roles: true },
    });

    if (!teacher || !this.hasRole(teacher.roles, AuthRole.Teacher)) {
      throw new BadRequestException(
        'Teacher is not eligible or does not exist',
      );
    }

    return teacher;
  }

  private async getClassroomWithMembersOrFail(
    classroomId: number,
    includeInactive = false,
  ): Promise<Classroom> {
    const classroom = await this.classroomRepository.findOne({
      where: includeInactive ? { id: classroomId } : { id: classroomId, is_active: true },
      relations: {
        teacher: true,
        students: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    return classroom;
  }

  private assertCanManageClassroom(classroom: Classroom, user: UserPayload): void {
    const isAdmin = user.roles.includes(AuthRole.Admins);
    const isOwnerTeacher =
      user.roles.includes(AuthRole.Teacher) && classroom.teacher?.id === user.id;

    if (!isAdmin && !isOwnerTeacher) {
      throw new ForbiddenException(
        'You are not allowed to manage this classroom',
      );
    }
  }

  private assertCanViewClassroom(classroom: Classroom, user: UserPayload): void {
    const isAdmin = user.roles.includes(AuthRole.Admins);
    const isOwnerTeacher =
      user.roles.includes(AuthRole.Teacher) && classroom.teacher?.id === user.id;
    const isStudentMember =
      user.roles.includes(AuthRole.Student) &&
      (classroom.students ?? []).some((student) => student.id === user.id);

    if (!isAdmin && !isOwnerTeacher && !isStudentMember) {
      throw new ForbiddenException('You are not allowed to access this classroom');
    }
  }

  private toClassroomListItem(
    classroom: Classroom,
    teacher: User | null,
    studentsCount: number,
  ): ClassroomListItem {
    return {
      id: classroom.id,
      name: classroom.name,
      code: classroom.code,
      is_active: classroom.is_active,
      teacher: this.toTeacherSummary(teacher),
      students_count: studentsCount,
    };
  }

  private toClassroomMembers(classroom: Classroom): ClassroomMembersResponse {
    const classmates = (classroom.students ?? [])
      .slice()
      .sort((a, b) =>
        `${a.name} ${a.lastname}`.localeCompare(`${b.name} ${b.lastname}`),
      )
      .map((student) => ({
        id: student.id,
        name: student.name,
        lastname: student.lastname,
        email: student.email,
        profile_image: student.profile_image ?? null,
      }));

    return {
      id: classroom.id,
      name: classroom.name,
      code: classroom.code,
      is_active: classroom.is_active,
      teacher: this.toTeacherSummary(classroom.teacher),
      classmates,
    };
  }

  private toTeacherSummary(teacher: User | null): ClassroomListItem['teacher'] {
    if (!teacher) {
      return null;
    }

    return {
      id: teacher.id,
      name: teacher.name,
      lastname: teacher.lastname,
      email: teacher.email,
      profile_image: teacher.profile_image ?? null,
    };
  }
}
