import * as dotenv from 'dotenv';
import { DataSource, QueryRunner } from 'typeorm';
import { Course } from './entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonStep } from './entities/lesson-step.entity';
import { LessonStepType } from './entities/lesson-step-type.entity';

dotenv.config();

interface StepData {
  order: number;
  title: string;
  description: string;
  typeCode: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  prompt: string;
  solution: string;
  options: string[];
}

interface LessonData {
  order: number;
  title: string;
  description: string;
  steps: StepData[];
}

class CoursesSeeder {
  private dataSource: DataSource;
  private queryRunner: QueryRunner;
  private stepTypes: Map<string, LessonStepType> = new Map();

  async initialize(): Promise<void> {
    console.log('[1/4] Initializing database connection...');
    this.dataSource = new DataSource({
      type: 'mysql',
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASS || '',
      database: process.env.MYSQL_DATABASE || 'hkunmr',
      entities: ['src/**/*.entity{.ts,.js}'],
      synchronize: false,
    });

    await this.dataSource.initialize();
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    console.log('      Database connection established successfully');
  }

  async seed(): Promise<void> {
    console.log('[2/4] Starting database transaction...');
    await this.queryRunner.startTransaction();

    try {
      console.log('      Transaction started');
      await this.seedLessonStepTypes();
      await this.seedCoursesWithLessons();

      console.log('[3/4] Committing transaction...');
      await this.queryRunner.commitTransaction();
      console.log('      Transaction committed successfully');

      await this.printSummary();
      console.log('\nSeeding process completed successfully');
    } catch (error) {
      console.error('[ERROR] Seeding failed, rolling back transaction...');
      await this.queryRunner.rollbackTransaction();
      console.error('        Transaction rolled back');
      throw error;
    }
  }

  private async seedLessonStepTypes(): Promise<void> {
    console.log('\n      [2.1] Seeding lesson step types...');

    const types = [
      {
        code: 'MULTIPLE_CHOICE',
        description: 'Multiple choice question with several options',
      },
      {
        code: 'TRUE_FALSE',
        description: 'True or false question',
      },
    ];

    const savedTypes = await Promise.all(
      types.map((type) => this.queryRunner.manager.save(LessonStepType, type)),
    );

    savedTypes.forEach((type) => {
      this.stepTypes.set(type.code, type);
    });

    console.log(
      `            Created ${types.length} lesson step types: ${types.map((t) => t.code).join(', ')}`,
    );
  }

  private async seedCoursesWithLessons(): Promise<void> {
    console.log('\n      [2.2] Seeding courses and lessons...');

    const course1Lessons: LessonData[] = [
      {
        order: 1,
        title: 'Introduction to MRI Basics',
        description:
          'Learn the fundamental concepts of Magnetic Resonance Imaging',
        steps: [
          {
            order: 1,
            title: 'What is MRI?',
            description: 'Basic understanding of MRI technology',
            typeCode: 'MULTIPLE_CHOICE',
            prompt: 'What does MRI stand for?',
            solution: 'Magnetic Resonance Imaging',
            options: [
              'Magnetic Resonance Imaging',
              'Medical Radiology Imaging',
              'Molecular Resonance Imaging',
              'Magnetic Radiation Imaging',
            ],
          },
          {
            order: 2,
            title: 'MRI Safety',
            description: 'Understanding MRI safety protocols',
            typeCode: 'TRUE_FALSE',
            prompt: 'MRI uses ionizing radiation like X-rays',
            solution: 'false',
            options: ['true', 'false'],
          },
          {
            order: 3,
            title: 'Magnetic Field',
            description: 'Understanding magnetic field strength',
            typeCode: 'MULTIPLE_CHOICE',
            prompt: 'What is the typical field strength of a clinical MRI?',
            solution: '1.5 to 3 Tesla',
            options: [
              '0.5 to 1 Tesla',
              '1.5 to 3 Tesla',
              '5 to 7 Tesla',
              '10 to 15 Tesla',
            ],
          },
        ],
      },
      {
        order: 2,
        title: 'Understanding T1 and T2 Relaxation',
        description: 'Deep dive into T1 and T2 weighted imaging',
        steps: [
          {
            order: 1,
            title: 'T1 Relaxation',
            description: 'Understanding T1 recovery characteristics',
            typeCode: 'MULTIPLE_CHOICE',
            prompt: 'Which tissue has the shortest T1 relaxation time?',
            solution: 'Fat',
            options: ['Fat', 'Water', 'Muscle', 'Bone'],
          },
          {
            order: 2,
            title: 'T2 Weighted Imaging',
            description: 'Characteristics of T2 images',
            typeCode: 'TRUE_FALSE',
            prompt: 'On T2-weighted images, water appears bright',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 3,
            title: 'Image Contrast',
            description: 'Understanding image contrast mechanisms',
            typeCode: 'TRUE_FALSE',
            prompt: 'Fat appears bright on T1-weighted images',
            solution: 'true',
            options: ['true', 'false'],
          },
        ],
      },
      {
        order: 3,
        title: 'Pulse Sequences Fundamentals',
        description: 'Explore the basics of MRI pulse sequences',
        steps: [
          {
            order: 1,
            title: 'Spin Echo Sequence',
            description: 'Basic spin echo fundamentals',
            typeCode: 'MULTIPLE_CHOICE',
            prompt: 'What is the most common basic pulse sequence?',
            solution: 'Spin Echo',
            options: [
              'Spin Echo',
              'Gradient Echo',
              'Inversion Recovery',
              'Echo Planar',
            ],
          },
          {
            order: 2,
            title: 'Gradient Echo',
            description: 'Understanding gradient echo sequences',
            typeCode: 'TRUE_FALSE',
            prompt: 'Gradient echo sequences use a 180° refocusing pulse',
            solution: 'false',
            options: ['true', 'false'],
          },
        ],
      },
    ];

    const course2Lessons: LessonData[] = [
      {
        order: 1,
        title: 'Advanced Imaging Techniques',
        description: 'Advanced MRI sequences and protocols',
        steps: [
          {
            order: 1,
            title: 'FLAIR Sequence',
            description: 'Fluid Attenuated Inversion Recovery',
            typeCode: 'TRUE_FALSE',
            prompt: 'FLAIR suppresses CSF signal',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 2,
            title: 'STIR Sequence',
            description: 'Short Tau Inversion Recovery',
            typeCode: 'MULTIPLE_CHOICE',
            prompt: 'What does STIR suppress?',
            solution: 'Fat',
            options: ['Fat', 'Water', 'Blood', 'CSF'],
          },
        ],
      },
      {
        order: 2,
        title: 'Diffusion Weighted Imaging',
        description: 'Understanding DWI and ADC maps',
        steps: [
          {
            order: 1,
            title: 'DWI Basics',
            description: 'Diffusion weighted imaging fundamentals',
            typeCode: 'TRUE_FALSE',
            prompt: 'DWI is useful for detecting acute stroke',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 2,
            title: 'ADC Maps',
            description: 'Understanding apparent diffusion coefficient',
            typeCode: 'MULTIPLE_CHOICE',
            prompt: 'What does ADC measure?',
            solution: 'Water molecule diffusion',
            options: [
              'Water molecule diffusion',
              'Blood flow velocity',
              'Tissue density',
              'Magnetic field strength',
            ],
          },
        ],
      },
    ];

    console.log('            Creating courses...');

    const [course1, course2, _course3] = await Promise.all([
      this.queryRunner.manager.save(Course, {
        title: 'Fundamentos de la seguridad informatica',
        is_active: true,
        position: 1,
      }),
      this.queryRunner.manager.save(Course, {
        title: 'Introduccion a Linux',
        is_active: true,
        position: 2,
      }),
      this.queryRunner.manager.save(Course, {
        title: 'Curso inactivo',
        is_active: false,
        position: 3,
      }),
    ]);

    console.log('            Created 3 courses (2 active, 1 inactive)');
    console.log('            Creating lessons and steps for Course 1...');

    await Promise.all(
      course1Lessons.map((lessonData) =>
        this.createLesson(course1, lessonData),
      ),
    );

    console.log(
      `            Course 1: Created ${course1Lessons.length} lessons with ${course1Lessons.reduce((sum, l) => sum + l.steps.length, 0)} steps`,
    );
    console.log('            Creating lessons and steps for Course 2...');

    await Promise.all(
      course2Lessons.map((lessonData) =>
        this.createLesson(course2, lessonData),
      ),
    );

    console.log(
      `            Course 2: Created ${course2Lessons.length} lessons with ${course2Lessons.reduce((sum, l) => sum + l.steps.length, 0)} steps`,
    );
    console.log(
      '            Course 3: Inactive demonstration course (no lessons)',
    );
  }

  private async createLesson(
    course: Course,
    lessonData: LessonData,
  ): Promise<void> {
    const lesson = await this.queryRunner.manager.save(Lesson, {
      title: lessonData.title,
      description: lessonData.description,
      course,
      order: lessonData.order,
      is_active: true,
    });

    await Promise.all(
      lessonData.steps.map((stepData) => {
        const stepType = this.stepTypes.get(stepData.typeCode);
        return this.queryRunner.manager.save(LessonStep, {
          title: stepData.title,
          description: stepData.description,
          lesson,
          order: stepData.order,
          type: stepType,
          prompt: stepData.prompt,
          solution: stepData.solution,
          options: JSON.stringify(stepData.options),
          lessonStepType: stepType,
          is_active: true,
        });
      }),
    );
  }

  private async printSummary(): Promise<void> {
    console.log('\n[4/4] Generating summary report...');

    const [coursesCount, lessonsCount, stepsCount, typesCount] =
      await Promise.all([
        this.queryRunner.manager.count(Course),
        this.queryRunner.manager.count(Lesson),
        this.queryRunner.manager.count(LessonStep),
        this.queryRunner.manager.count(LessonStepType),
      ]);

    console.log('\n========================================');
    console.log('Database Seeding Summary');
    console.log('========================================');
    console.log(`Lesson Step Types:  ${typesCount}`);
    console.log(`Courses:            ${coursesCount}`);
    console.log(`Lessons:            ${lessonsCount}`);
    console.log(`Lesson Steps:       ${stepsCount}`);
    console.log('========================================\n');
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up database connections...');
    if (this.queryRunner) {
      await this.queryRunner.release();
      console.log('      Query runner released');
    }
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      console.log('      Data source destroyed');
    }
  }
}

async function main() {
  const seeder = new CoursesSeeder();

  try {
    await seeder.initialize();
    await seeder.seed();
  } catch (error) {
    console.error('\n========================================');
    console.error('SEEDING FAILED');
    console.error('========================================');
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('========================================\n');
    process.exit(1);
  } finally {
    await seeder.cleanup();
  }

  process.exit(0);
}

void main();
