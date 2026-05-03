import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function configureSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const preferredTags = [
    'Auth',
    'Users [General]',
    'Users [Admin]',
    'Users [Profesores]',
    'Courses [Admin]',
    'Courses [Profesores]',
    'Courses [Estudiantes]',
    'Lessons [Admin]',
    'Lessons [Profesores]',
    'Lessons [Estudiantes]',
    'Lesson Steps [Admin]',
    'Lesson Steps [Profesores]',
    'Lesson Steps [Estudiantes]',
    'Classrooms [Admin]',
    'Classrooms [Profesores]',
    'Classrooms [Estudiantes]',
    'Roles [Admin only]',
  ];

  if (Array.isArray(document.tags) && document.tags.length > 0) {
    const byName = new Map(document.tags.map((tag) => [tag.name.toLowerCase(), tag]));

    const orderedPreferred = preferredTags
      .map((name) => byName.get(name.toLowerCase()))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));

    const preferredNamesLower = preferredTags.map((name) => name.toLowerCase());
    const remaining = document.tags.filter(
      (tag) => !preferredNamesLower.includes(tag.name.toLowerCase()),
    );

    document.tags = [...orderedPreferred, ...remaining];
  }

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      tagsSorter: (a: string, b: string) => {
        const explicitOrder = new Map<string, number>([
          ['auth', 0],
          ['users [general]', 1],
          ['users [admin]', 2],
          ['users [profesores]', 3],
          ['courses [admin]', 4],
          ['courses [profesores]', 5],
          ['courses [estudiantes]', 6],
          ['lessons [admin]', 7],
          ['lessons [profesores]', 8],
          ['lessons [estudiantes]', 9],
          ['lesson steps [admin]', 10],
          ['lesson steps [profesores]', 11],
          ['lesson steps [estudiantes]', 12],
          ['classrooms [admin]', 13],
          ['classrooms [profesores]', 14],
          ['classrooms [estudiantes]', 15],
          ['roles [admin only]', 16],
        ]);

        const getRank = (tag: string): number => {
          const normalized = tag.toLowerCase();
          const explicitRank = explicitOrder.get(normalized);
          if (explicitRank !== undefined) return explicitRank;
          if (tag.includes('[Admin]')) return 17;
          if (tag.includes('[Profesores]')) return 18;
          if (tag.includes('[Estudiantes]')) return 19;
          return 20;
        };

        const rankDiff = getRank(a) - getRank(b);
        if (rankDiff !== 0) return rankDiff;
        return a.localeCompare(b);
      },
      operationsSorter: 'alpha',
    },
  });
}
