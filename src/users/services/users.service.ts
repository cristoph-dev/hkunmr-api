import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, UpdateResult } from 'typeorm';
import { Role, User } from '../entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
