import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, UpdateResult } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username }, { email }],
    });
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
}
