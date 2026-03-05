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
  typeCode:
  | 'MULTIPLE_CHOICE'
  | 'SINGLE_CHOICE'
  | 'TRUE_FALSE'
  | 'THEORY'
  | 'THEORY_COMPLETE'
  | 'CODE_COMPLETE'
  | 'CODE_COMPLETE_TYPED'
  | 'COMPLETION';
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
        code: 'THEORY',
        description: 'Theoretical content step without evaluation',
      },
      {
        code: 'THEORY_COMPLETE',
        description: 'Complete a theoretical sentence by selecting the correct option',
      },
      {
        code: 'SINGLE_CHOICE',
        description: 'Single choice question with one correct answer',
      },
      {
        code: 'MULTIPLE_CHOICE',
        description: 'Multiple choice question with multiple correct answers',
      },
      {
        code: 'TRUE_FALSE',
        description: 'True or false question',
      },
      {
        code: 'CODE_COMPLETE',
        description: 'Complete a code fragment by selecting the correct option',
      },
      {
        code: 'CODE_COMPLETE_TYPED',
        description: 'Complete a code fragment by typing the correct answer manually',
      },
      {
        code: 'COMPLETION',
        description: 'Final lesson completion screen',
      },
    ];

    for (const type of types) {
      const existing = await this.queryRunner.manager.findOne(
        LessonStepType,
        { where: { code: type.code } },
      );

      if (!existing) {
        const saved = await this.queryRunner.manager.save(
          LessonStepType,
          type,
        );
        this.stepTypes.set(saved.code, saved);
      } else {
        this.stepTypes.set(existing.code, existing);
      }
    }

    console.log(
      `            Seeded ${types.length} lesson step types`,
    );
  }

  private async seedCoursesWithLessons(): Promise<void> {
    console.log('\n      [2.2] Seeding courses and lessons...');

    const course1Lessons: LessonData[] = [
    {
      order: 1,
      title: 'Introducción a la Seguridad Informática',
      description:
        'Conceptos fundamentales de amenazas, vulnerabilidades y riesgos en entornos digitales.',
      steps: [
        {
          order: 1,
          title: '¿Qué es la Seguridad Informática?',
          description: 'Concepto general de seguridad informática',
          typeCode: 'THEORY',
          prompt: `La seguridad informática es el conjunto de prácticas, tecnologías y procesos diseñados para proteger sistemas, redes y datos de accesos no autorizados, daños o ataques.

    Vivimos en un mundo donde casi toda la información valiosa existe en formato digital: datos bancarios, historiales médicos, comunicaciones privadas e infraestructuras críticas.

    La seguridad informática abarca tres grandes áreas:

    • Seguridad de redes  
    • Seguridad de sistemas  
    • Seguridad de la información`,
          solution: '',
          options: [],
        },

        {
          order: 2,
          title: '¿Qué es una Amenaza?',
          description: 'Definición de amenaza en seguridad',
          typeCode: 'THEORY',
          prompt: `Una amenaza es cualquier evento o acción con potencial de causar daño a un sistema, red o dato.

    Puede ser:

    • Interna  
    • Externa  
    • Accidental  
    • Deliberada  

    Las amenazas necesitan explotar una vulnerabilidad para causar daño.`,
          solution: '',
          options: [],
        },

        {
          order: 3,
          title: '¿Qué es una Vulnerabilidad?',
          description: 'Tipos de vulnerabilidades',
          typeCode: 'THEORY',
          prompt: `Una vulnerabilidad es una debilidad en un sistema, proceso o persona que una amenaza puede explotar.

    Tipos principales:

    • Técnicas  
    • Humanas  
    • Físicas  

    Relación fundamental:  
    Amenaza + Vulnerabilidad = Riesgo`,
          solution: '',
          options: [],
        },

        {
          order: 4,
          title: 'Definición correcta',
          description: 'Selecciona la definición correcta',
          typeCode: 'SINGLE_CHOICE',
          prompt:
            '¿Cuál de las siguientes opciones define mejor la seguridad informática?',
          solution:
            'El conjunto de prácticas para proteger sistemas, redes y datos de accesos no autorizados',
          options: [
            'Instalar antivirus en todos los equipos de la empresa',
            'El conjunto de prácticas para proteger sistemas, redes y datos de accesos no autorizados',
            'Evitar que los empleados usen internet en el trabajo',
            'Cifrar todos los archivos de una organización',
          ],
        },

        {
          order: 5,
          title: 'Amenaza accidental',
          description: 'Clasificación de amenazas',
          typeCode: 'TRUE_FALSE',
          prompt:
            'Un ataque accidental, como un técnico que borra una base de datos por error, NO se considera una amenaza.',
          solution: 'false',
          options: ['true', 'false'],
        },

        {
          order: 6,
          title: 'Vulnerabilidades humanas',
          description: 'Identificar vulnerabilidades humanas',
          typeCode: 'MULTIPLE_CHOICE',
          prompt:
            '¿Cuáles de los siguientes son ejemplos de vulnerabilidades humanas?',
          solution: JSON.stringify([
            'Un empleado que usa "123456" como contraseña',
            'Un trabajador que abre un enlace sospechoso en su correo',
            'Un técnico que comparte sus credenciales con un compañero',
          ]),
          options: [
            'Un empleado que usa "123456" como contraseña',
            'Un trabajador que abre un enlace sospechoso en su correo',
            'Un servidor con software desactualizado',
            'Un técnico que comparte sus credenciales con un compañero',
            'Una puerta de servidor sin cerrojo',
          ],
        },

        {
          order: 7,
          title: 'Relación fundamental',
          description: 'Completar concepto clave',
          typeCode: 'THEORY_COMPLETE',
          prompt:
            'Cuando una ________ explota una ________, se genera un ________.',
          solution: JSON.stringify([
            'Amenaza',
            'Vulnerabilidad',
            'Riesgo',
          ]),
          options: ['Amenaza', 'Vulnerabilidad', 'Riesgo'],
        },

        {
          order: 8,
          title: 'Identificación de vulnerabilidad',
          description: 'Análisis de escenario',
          typeCode: 'SINGLE_CHOICE',
          prompt:
            'Una empresa tiene un servidor con una versión antigua de software que nunca fue actualizada. ¿Qué rol cumple el software desactualizado?',
          solution: 'Es la vulnerabilidad',
          options: [
            'Es la amenaza',
            'Es el riesgo',
            'Es la vulnerabilidad',
            'Es el ataque',
          ],
        },

        {
          order: 9,
          title: 'Conceptos fundamentales',
          description: 'Evaluación final de conceptos',
          typeCode: 'MULTIPLE_CHOICE',
          prompt:
            '¿Cuáles de las siguientes afirmaciones son correctas?',
          solution: JSON.stringify([
            'Una amenaza interna puede ser un empleado malintencionado',
            'Una vulnerabilidad física puede ser una sala de servidores sin llave',
            'El factor humano es históricamente el eslabón más débil en seguridad',
          ]),
          options: [
            'Una amenaza interna puede ser un empleado malintencionado',
            'Una vulnerabilidad física puede ser una sala de servidores sin llave',
            'Si no hay amenazas activas, las vulnerabilidades dejan de importar',
            'El factor humano es históricamente el eslabón más débil en seguridad',
            'La seguridad informática solo aplica a grandes empresas',
          ],
        },
      ],
    },
    {
      order: 2,
      title: 'Fundamentos de Hacking Etico',
      description:
        'Que es el hacking etico, sus principios y su rol en la ciberseguridad defensiva.',
      steps: [
        {
          order: 1,
          title: 'Que es el Hacking Etico',
          description: 'Concepto base y objetivo principal',
          typeCode: 'THEORY',
          prompt: `El hacking etico es la practica autorizada de identificar vulnerabilidades en sistemas, redes y aplicaciones para corregirlas antes de que sean explotadas por atacantes reales.

Su objetivo no es causar dano, sino mejorar la seguridad.

Un hacker etico trabaja con permiso explicito y dentro de un alcance definido.`,
          solution: '',
          options: [],
        },
        {
          order: 2,
          title: 'Principios del Hacking Etico',
          description: 'Reglas basicas que debe cumplir un profesional',
          typeCode: 'THEORY',
          prompt: `Los principios esenciales del hacking etico son:

• Autorizacion formal
• Alcance claro
• No causar interrupciones innecesarias
• Reporte responsable de hallazgos
• Confidencialidad de la informacion evaluada`,
          solution: '',
          options: [],
        },
        {
          order: 3,
          title: 'Definicion correcta',
          description: 'Selecciona la opcion correcta',
          typeCode: 'SINGLE_CHOICE',
          prompt:
            'Cual opcion describe mejor el hacking etico?',
          solution:
            'Pruebas autorizadas para detectar y corregir vulnerabilidades antes de un ataque real',
          options: [
            'Acceder sin permiso para demostrar fallos',
            'Pruebas autorizadas para detectar y corregir vulnerabilidades antes de un ataque real',
            'Crear malware para validar antivirus',
            'Evitar el uso de controles de seguridad para probar velocidad',
          ],
        },
        {
          order: 4,
          title: 'Autorizacion',
          description: 'Validacion de principio legal y etico',
          typeCode: 'TRUE_FALSE',
          prompt:
            'Un pentest sin autorizacion escrita puede considerarse una actividad ilegal.',
          solution: 'true',
          options: ['true', 'false'],
        },
        {
          order: 5,
          title: 'Actividades del hacker etico',
          description: 'Selecciona las actividades alineadas al rol',
          typeCode: 'MULTIPLE_CHOICE',
          prompt:
            'Cuales acciones pertenecen al trabajo de un hacker etico?',
          solution: JSON.stringify([
            'Realizar pruebas de penetracion dentro del alcance acordado',
            'Documentar vulnerabilidades y evidencias tecnicas',
            'Entregar recomendaciones de mitigacion priorizadas',
          ]),
          options: [
            'Realizar pruebas de penetracion dentro del alcance acordado',
            'Documentar vulnerabilidades y evidencias tecnicas',
            'Publicar datos sensibles encontrados durante la prueba',
            'Entregar recomendaciones de mitigacion priorizadas',
            'Mantener acceso oculto para futuras auditorias',
          ],
        },
        {
          order: 6,
          title: 'Cadena de valor',
          description: 'Completar concepto clave',
          typeCode: 'THEORY_COMPLETE',
          prompt:
            'El hacking etico busca ________ vulnerabilidades para ________ riesgos.',
          solution: JSON.stringify([
            'identificar',
            'reducir',
          ]),
          options: ['identificar', 'reducir', 'ignorar', 'aumentar'],
        },
      ],
    },
    {
      order: 3,
      title: 'Que es la Triada CIA',
      description:
        'Base conceptual de confidencialidad, integridad y disponibilidad en seguridad de la informacion.',
      steps: [
        {
          order: 1,
          title: 'Introduccion a CIA',
          description: 'Concepto general de la triada CIA',
          typeCode: 'THEORY',
          prompt: `La triada CIA es un modelo fundamental de seguridad de la informacion compuesto por:

• Confidencialidad
• Integridad
• Disponibilidad

Estos tres principios guian el diseno de controles y politicas de seguridad.`,
          solution: '',
          options: [],
        },
        {
          order: 2,
          title: 'Confidencialidad',
          description: 'Acceso solo para usuarios autorizados',
          typeCode: 'THEORY',
          prompt: `La confidencialidad asegura que la informacion solo sea accesible por personas o sistemas autorizados.

Controles comunes:
• Cifrado
• Control de acceso
• Gestion de identidades`,
          solution: '',
          options: [],
        },
        {
          order: 3,
          title: 'Integridad y Disponibilidad',
          description: 'Definiciones y ejemplos practicos',
          typeCode: 'THEORY',
          prompt: `Integridad: garantiza que los datos no sean alterados de forma no autorizada.
Disponibilidad: asegura que sistemas y datos esten accesibles cuando se necesiten.

Ejemplos:
• Integridad: hashes, firmas digitales, control de cambios
• Disponibilidad: redundancia, respaldos, monitoreo`,
          solution: '',
          options: [],
        },
        {
          order: 4,
          title: 'Concepto CIA',
          description: 'Seleccion de definicion correcta',
          typeCode: 'SINGLE_CHOICE',
          prompt:
            'Que representa la triada CIA en seguridad?',
          solution:
            'Confidencialidad, Integridad y Disponibilidad',
          options: [
            'Control, Identificacion y Autenticacion',
            'Confidencialidad, Integridad y Disponibilidad',
            'Cifrado, Inspeccion y Auditoria',
            'Clasificacion, Inventario y Aseguramiento',
          ],
        },
        {
          order: 5,
          title: 'Disponibilidad',
          description: 'Evaluar concepto de disponibilidad',
          typeCode: 'TRUE_FALSE',
          prompt:
            'Si un sistema critico esta caido y no se puede acceder a la informacion, se afecta la disponibilidad.',
          solution: 'true',
          options: ['true', 'false'],
        },
        {
          order: 6,
          title: 'Relacionar controles',
          description: 'Asociar controles con cada principio',
          typeCode: 'MULTIPLE_CHOICE',
          prompt:
            'Cuales opciones son controles validos para la triada CIA?',
          solution: JSON.stringify([
            'Cifrado para proteger la confidencialidad',
            'Hashes para verificar la integridad',
            'Respaldos y redundancia para la disponibilidad',
          ]),
          options: [
            'Cifrado para proteger la confidencialidad',
            'Hashes para verificar la integridad',
            'Respaldos y redundancia para la disponibilidad',
            'Deshabilitar logs para mejorar rendimiento',
            'Compartir credenciales para acceso rapido',
          ],
        },
        {
          order: 7,
          title: 'Triada completa',
          description: 'Completar componentes de CIA',
          typeCode: 'THEORY_COMPLETE',
          prompt:
            'CIA significa ________, ________ y ________.',
          solution: JSON.stringify([
            'Confidencialidad',
            'Integridad',
            'Disponibilidad',
          ]),
          options: ['Confidencialidad', 'Integridad', 'Disponibilidad'],
        },
      ],
    },
  ];

    const course2Lessons: LessonData[] = [
      {
        order: 1,
        title: 'Comandos Basicos de la Terminal Linux',
        description:
          'Introduccion a la terminal, sistema de archivos y comandos de navegacion esenciales.',
        steps: [
          {
            order: 1,
            title: 'Que es la Terminal?',
            description: 'Concepto de terminal y shell',
            typeCode: 'THEORY',
            prompt: `La terminal (o shell) es una interfaz de texto para interactuar con el sistema operativo.

Es poderosa porque permite ejecutar comandos de forma rapida, automatizar tareas y administrar el sistema con precision.

En Linux, casi todo se representa como archivo.

Prompt basico:
usuario@maquina:~$

Rutas:
- Absoluta: /home/user/docs
- Relativa: ../docs`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'El sistema de archivos de Linux',
            description: 'Estructura base de directorios',
            typeCode: 'THEORY',
            prompt: `La estructura de Linux parte de /, que es la raiz del sistema.

Directorios importantes:
- /home: directorios de usuarios
- /etc: configuraciones del sistema
- /var: logs y datos variables
- /tmp: archivos temporales

Cada usuario tiene su espacio en /home/nombre_usuario, representado tambien por ~.`,
            solution: '',
            options: [],
          },
          {
            order: 3,
            title: 'Navegando directorios: pwd, ls, cd',
            description: 'Comandos de navegacion basicos',
            typeCode: 'THEORY',
            prompt: `pwd: muestra el directorio actual.
ls: lista el contenido del directorio actual.
ls -la: muestra permisos, tamano y archivos ocultos.
cd ruta: cambia de directorio.
cd ..: sube un nivel.
cd ~: vuelve al home del usuario.`,
            solution: '',
            options: [],
          },
          {
            order: 4,
            title: 'Completa las rutas',
            description: 'Completar conceptos de rutas',
            typeCode: 'THEORY_COMPLETE',
            prompt:
              'El directorio raiz de Linux se llama __. El directorio personal de cada usuario esta en __/nombre. Para volver al home desde cualquier lugar usas cd __.',
            solution: JSON.stringify([
              '/',
              '/home',
              '~',
            ]),
            options: ['/', '/home', '~'],
          },
          {
            order: 5,
            title: 'Navegacion relativa',
            description: 'Analisis de ubicacion con cd',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Estas en /home/user/documentos/proyectos. Ejecutas cd ../.. . Donde estas ahora?',
            solution: '/home/user',
            options: ['/home/user/documentos', '/home/user', '/home', '/'],
          },
          {
            order: 6,
            title: 'Listar con detalles y ocultos',
            description: 'Completar comando ls',
            typeCode: 'CODE_COMPLETE',
            prompt:
              'Como listarias el contenido con todos los detalles incluyendo archivos ocultos?\n\nbash\nls ___',
            solution: '-la',
            options: ['-la', '-r', '-h', '-d'],
          },
          {
            order: 7,
            title: 'Ir a /etc',
            description: 'Completar comando de navegacion',
            typeCode: 'CODE_COMPLETE',
            prompt:
              'Navega al directorio /etc desde cualquier ubicacion.\n\nbash\n___ /etc',
            solution: 'cd',
            options: ['cd', 'ls', 'pwd', 'mv'],
          },
          {
            order: 8,
            title: 'Directorio actual',
            description: 'Escribir comando pwd',
            typeCode: 'CODE_COMPLETE_TYPED',
            prompt:
              'Escribe el comando para ver en que directorio estas actualmente.\n\nbash\n___',
            solution: 'pwd',
            options: [],
          },
          {
            order: 9,
            title: 'Subir nivel vs raiz',
            description: 'Validar comportamiento de cd ..',
            typeCode: 'TRUE_FALSE',
            prompt:
              'cd .. te lleva siempre al directorio raiz /.',
            solution: 'false',
            options: ['true', 'false'],
          },
          {
            order: 10,
            title: 'Ruta relativa',
            description: 'Escribir comando de navegacion relativa',
            typeCode: 'CODE_COMPLETE_TYPED',
            prompt:
              'Estas en /home/user. Escribe el comando para ir a /home/user/documentos/proyectos usando ruta relativa.\n\nbash\n___',
            solution: 'cd documentos/proyectos',
            options: [],
          },
          {
            order: 11,
            title: 'Comandos validos de navegacion',
            description: 'Selecciona los comandos correctos',
            typeCode: 'MULTIPLE_CHOICE',
            prompt:
              'Cuales de los siguientes comandos son validos para navegar el sistema de archivos?',
            solution: JSON.stringify([
              'cd /var/log',
              'ls -la /etc',
              'cd ~',
              'pwd',
            ]),
            options: [
              'cd /var/log',
              'ls -la /etc',
              'goto /home',
              'cd ~',
              'pwd',
              'navigate ../docs',
            ],
          },
        ],
      },
      {
        order: 2,
        title: 'Creando y Eliminando en la Terminal',
        description:
          'Comandos para crear y eliminar archivos y directorios en Linux.',
        steps: [
          {
            order: 1,
            title: 'Crear archivos y directorios',
            description: 'Uso de touch y mkdir',
            typeCode: 'THEORY',
            prompt: `Dos comandos esenciales:

touch nombre.txt: crea un archivo vacio. Si ya existe, actualiza su fecha de modificacion.
mkdir nombre: crea un directorio.
mkdir -p ruta/completa/anidada: crea una jerarquia completa en una sola instruccion.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Eliminar archivos y directorios',
            description: 'Uso de rm, rm -r y rmdir',
            typeCode: 'THEORY',
            prompt: `rm archivo.txt: elimina un archivo (sin papelera).
rm -r carpeta/: elimina una carpeta y todo su contenido.
rmdir carpeta/: elimina una carpeta solo si esta vacia.

Advertencia:
rm -rf / es extremadamente peligroso porque puede eliminar todo el sistema.`,
            solution: '',
            options: [],
          },
          {
            order: 3,
            title: 'Crear directorio proyectos',
            description: 'Completar comando mkdir',
            typeCode: 'CODE_COMPLETE',
            prompt:
              'Crea un directorio llamado proyectos.\n\nbash\n___ proyectos',
            solution: 'mkdir',
            options: ['mkdir', 'touch', 'rm', 'cd'],
          },
          {
            order: 4,
            title: 'Crear ruta completa',
            description: 'Completar bandera de mkdir',
            typeCode: 'CODE_COMPLETE',
            prompt:
              'Crea toda la ruta /home/user/curso/linux/ejercicios de una sola vez.\n\nbash\nmkdir ___ /home/user/curso/linux/ejercicios',
            solution: '-p',
            options: ['-p', '-r', '-la', '-f'],
          },
          {
            order: 5,
            title: 'Crear archivo vacio',
            description: 'Escribir comando touch',
            typeCode: 'CODE_COMPLETE_TYPED',
            prompt:
              'Crea un archivo vacio llamado notas.txt.\n\nbash\n___ notas.txt',
            solution: 'touch',
            options: [],
          },
          {
            order: 6,
            title: 'Limite de rmdir',
            description: 'Validar uso correcto de rmdir',
            typeCode: 'TRUE_FALSE',
            prompt:
              'El comando rmdir puede eliminar una carpeta que contiene archivos dentro.',
            solution: 'false',
            options: ['true', 'false'],
          },
          {
            order: 7,
            title: 'Eliminar carpeta con contenido',
            description: 'Seleccionar comando correcto',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Quieres eliminar la carpeta proyectos que tiene archivos dentro. Que comando usas?',
            solution: 'rm -r proyectos',
            options: [
              'rmdir proyectos',
              'rm proyectos',
              'rm -r proyectos',
              'delete proyectos',
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
