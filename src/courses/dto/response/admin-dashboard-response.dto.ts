import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardResponseDto {
  @ApiProperty({ example: 20, description: 'Usuarios activos' })
  users_active: number;

  @ApiProperty({ example: 3, description: 'Cursos publicados (activos)' })
  courses_published: number;

  @ApiProperty({ example: 10, description: 'Lecciones completadas por usuarios' })
  lessons_completed: number;

  @ApiProperty({ example: 3, description: 'Salones activos' })
  classrooms_active: number;

  @ApiProperty({ example: 2, description: 'Cantidad de profesores activos' })
  teachers: number;

  @ApiProperty({ example: 18, description: 'Cantidad de estudiantes activos' })
  students: number;

  @ApiProperty({ example: 3, description: 'Total de cursos' })
  courses: number;

  @ApiProperty({ example: 43, description: 'Total de lecciones activas' })
  lessons: number;

  @ApiProperty({ example: 215, description: 'Total de pasos de leccion activos' })
  lesson_steps: number;
}
