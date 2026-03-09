import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, UpdateResult } from 'typeorm';
import { Role, User } from '../entities';
import { AuthRole } from 'src/common/guards/role.guard';
import { Classroom } from 'src/classroom/entities/classroom.entity';

interface AdminTeacherListItem {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role: AuthRole;
  classrooms_count: number;
}

interface StudentCandidateItem {
  id: number;
  name: string;
  lastname: string;
  email: string;
}

interface StudentCandidatesPaginated {
  items: StudentCandidateItem[];
  total: number;
  page: number;
  limit: number;
}

interface AdminStudentListPaginated {
  items: StudentCandidateItem[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role', 'role.is_active = :isActive', {
        isActive: true,
      })
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role', 'role.is_active = :isActive', {
        isActive: true,
      })
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(data: Partial<User>, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    const user = repo.create(data);
    return repo.save(user);
  }

  async activateUser(
    email: string,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    return repo.update(
      { email, email_verified: false },
      { email_verified: true },
    );
  }

  async updatePassword(
    email: string,
    password: string,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    return repo.update({ email }, { password });
  }

  async findByRole(roleId: number, manager?: EntityManager): Promise<User[]> {
    const repository = manager
      ? manager.getRepository(User)
      : this.userRepository;
    return repository.find({ where: { roles: { id: roleId } } });
  }

  async assignRole(userId: number, roleId: number): Promise<boolean> {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .add(roleId);

    return true;
  }

  async revokeRole(userId: number, roleId: number): Promise<boolean> {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(userId)
      .remove(roleId);

    return true;
  }

  async updateRole(userId: number, roleId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
    });
    if (user) {
      user.roles = [{ id: roleId } as Role];
      await this.userRepository.save(user);
    }
  }

  async listTeachersForAdmin(): Promise<AdminTeacherListItem[]> {
    const teachers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role', 'role.is_active = :active', {
        active: true,
      })
      .where('user.is_active = :isActive', { isActive: true })
      .andWhere('role.description = :teacherRole', {
        teacherRole: AuthRole.Teacher,
      })
      .orderBy('user.name', 'ASC')
      .addOrderBy('user.lastname', 'ASC')
      .getMany();

    return await Promise.all(
      teachers.map(async (teacher) => {
        const classroomsCount = await this.classroomRepository.count({
          where: {
            teacher: { id: teacher.id },
            is_active: true,
          },
        });

        return {
          id: teacher.id,
          name: teacher.name,
          lastname: teacher.lastname,
          email: teacher.email,
          role: AuthRole.Teacher,
          classrooms_count: classroomsCount,
        };
      }),
    );
  }

  async promoteStudentToTeacher(userId: number): Promise<boolean> {
    const [user, teacherRole] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId, is_active: true },
        relations: { roles: true },
      }),
      this.roleRepository.findOne({
        where: { description: AuthRole.Teacher, is_active: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!teacherRole) {
      throw new NotFoundException('Teacher role not found');
    }

    user.roles = [teacherRole];
    await this.userRepository.save(user);
    return true;
  }

  async demoteTeacherToStudent(userId: number): Promise<boolean> {
    const [user, studentRole] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId, is_active: true },
        relations: { roles: true },
      }),
      this.roleRepository.findOne({
        where: { description: AuthRole.Student, is_active: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    user.roles = [studentRole];
    await this.userRepository.save(user);
    return true;
  }

  async softDeleteUser(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_active = false;
    await this.userRepository.save(user);
    return true;
  }

  async updateMyProfileNames(
    userId: number,
    payload: { name?: string; lastname?: string },
  ): Promise<{ id: number; name: string; lastname: string; email: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (typeof payload.name === 'string') {
      user.name = payload.name.trim();
    }

    if (typeof payload.lastname === 'string') {
      user.lastname = payload.lastname.trim();
    }

    const updated = await this.userRepository.save(user);
    return {
      id: updated.id,
      name: updated.name,
      lastname: updated.lastname,
      email: updated.email,
    };
  }

  async updateUserByAdmin(
    userId: number,
    payload: { name?: string; lastname?: string; is_active?: boolean },
  ): Promise<{
    id: number;
    name: string;
    lastname: string;
    email: string;
    is_active: boolean;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (typeof payload.name === 'string') {
      user.name = payload.name.trim();
    }

    if (typeof payload.lastname === 'string') {
      user.lastname = payload.lastname.trim();
    }

    if (typeof payload.is_active === 'boolean') {
      user.is_active = payload.is_active;
    }

    const updated = await this.userRepository.save(user);
    return {
      id: updated.id,
      name: updated.name,
      lastname: updated.lastname,
      email: updated.email,
      is_active: updated.is_active,
    };
  }

  async listStudentCandidatesForTeacherPromotion(
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<StudentCandidatesPaginated> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : 20;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('user.is_active = :isActive', { isActive: true })
      .andWhere('role.is_active = :roleActive', { roleActive: true })
      .andWhere('role.description = :studentRole', {
        studentRole: AuthRole.Student,
      });

    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      qb.andWhere(
        '(user.name LIKE :q OR user.lastname LIKE :q OR user.email LIKE :q)',
        { q },
      );
    }

    const [users, total] = await qb
      .orderBy('user.name', 'ASC')
      .addOrderBy('user.lastname', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return {
      items: users.map((u) => ({
        id: u.id,
        name: u.name,
        lastname: u.lastname,
        email: u.email,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async listStudentsForAdmin(
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<AdminStudentListPaginated> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : 20;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('user.is_active = :isActive', { isActive: true })
      .andWhere('role.is_active = :roleActive', { roleActive: true })
      .andWhere('role.description = :studentRole', {
        studentRole: AuthRole.Student,
      });

    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      qb.andWhere(
        '(user.name LIKE :q OR user.lastname LIKE :q OR user.email LIKE :q)',
        { q },
      );
    }

    const [users, total] = await qb
      .orderBy('user.name', 'ASC')
      .addOrderBy('user.lastname', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return {
      items: users.map((u) => ({
        id: u.id,
        name: u.name,
        lastname: u.lastname,
        email: u.email,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }
}
