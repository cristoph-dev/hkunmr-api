import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Role } from 'src/users/entities';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(data: Partial<Role>, manager?: EntityManager): Promise<Role> {
    const repository = manager
      ? manager.getRepository(Role)
      : this.roleRepository;
    const role = repository.create(data);
    return repository.save(role);
  }

  async findAll(manager?: EntityManager): Promise<Role[]> {
    const repository = manager
      ? manager.getRepository(Role)
      : this.roleRepository;
    return repository.find();
  }

  async findById(id: number, manager?: EntityManager): Promise<Role | null> {
    const repository = manager
      ? manager.getRepository(Role)
      : this.roleRepository;
    return repository.findOne({ where: { id } });
  }

  async delete(id: number, manager?: EntityManager): Promise<void> {
    const repository = manager
      ? manager.getRepository(Role)
      : this.roleRepository;
    await repository.update(id, { is_active: false });
  }

  async update(
    id: number,
    data: Partial<Role>,
    manager?: EntityManager,
  ): Promise<Role> {
    const repository = manager
      ? manager.getRepository(Role)
      : this.roleRepository;
    const role = await repository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('');
    }
    await repository.update(id, data);
    return role;
  }
}
