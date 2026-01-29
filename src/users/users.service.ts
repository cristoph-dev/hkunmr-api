import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, UpdateResult } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
    });
  }

  async create(data: Partial<User>, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    const user = repo.create(data);
    return repo.save(user);
  }

  async activateUser(email: string, manager?: EntityManager): Promise<UpdateResult> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    return repo.update({ email, email_verified: false }, { email_verified: true });
  }
}
