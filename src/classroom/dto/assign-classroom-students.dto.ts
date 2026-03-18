import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AssignClassroomStudentsDto {
  @ApiProperty({
    example: [8, 12, 14],
    description: 'IDs de estudiantes a agregar al salon',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  student_ids: number[];
}
