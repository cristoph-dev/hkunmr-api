import { IsString } from 'class-validator';
import { AuthRole } from 'src/common/guards/role.guard';

export class CreateRoleDto {
  @IsString()
  description: AuthRole;
}
