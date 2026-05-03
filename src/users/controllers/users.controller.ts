import {
  Controller,
  Patch,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UsersService } from '../services/users.service';
import { AllRoles } from 'src/common/guards/role.guard';
import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';

@ApiTags('Users [General]')
@ApiBearerAuth()
@Controller('users')
export class UsersGeneralController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @AllRoles()
  @ApiOperation({ summary: 'Actualizar mi perfil (name/lastname)' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  async updateMyProfile(
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: UpdateMyProfileDto,
  ): Promise<{
    id: number;
    name: string;
    lastname: string;
    email: string;
    profile_image: string | null;
  }> {
    return await this.usersService.updateMyProfileNames(user.id, payload);
  }

  @Patch('me/image')
  @AllRoles()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'public', 'profile-images');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const randomSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${randomSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Tipo de archivo no permitido'),
            false,
          );
        }

        cb(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Actualizar mi imagen de perfil' })
  @ApiResponse({
    status: 200,
    description: 'Imagen de perfil actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Archivo invalido' })
  async updateMyProfileImage(
    @AuthenticatedUser() user: UserPayload,
    @UploadedFile() file?: { filename: string },
  ): Promise<{
    id: number;
    name: string;
    lastname: string;
    email: string;
    profile_image: string | null;
  }> {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo');
    }

    const imageUrl = `/public/profile-images/${file.filename}`;
    return await this.usersService.updateMyProfileImage(user.id, imageUrl);
  }
}
