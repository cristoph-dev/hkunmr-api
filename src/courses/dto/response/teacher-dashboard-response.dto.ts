import { ApiProperty } from '@nestjs/swagger';

export class TeacherDashboardResponseDto {
  @ApiProperty({ example: 3, description: 'Cantidad de estudiantes activos' })
  students_active: number;

  @ApiProperty({ example: 5, description: 'Cursos publicados (activos)' })
  courses_published: number;

  @ApiProperty({ example: 10, description: 'Lecciones completadas por usuarios' })
  lessons_completed: number;

  @ApiProperty({ example: 2, description: 'Salones activos' })
  classrooms_active: number;

  @ApiProperty({ example: 3, description: 'Cantidad de estudiantes activos' })
  students: number;

  @ApiProperty({ example: 6, description: 'Total de cursos' })
  courses: number;

  @ApiProperty({ example: 12, description: 'Total de lecciones activas' })
  lessons: number;

  @ApiProperty({ example: 44, description: 'Total de pasos de leccion activos' })
  lesson_steps: number;
}
