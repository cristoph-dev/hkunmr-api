import * as dotenv from 'dotenv';
import { DataSource, QueryRunner } from 'typeorm';
import { Course, CourseScope } from '../entities/course.entity';
import { Lesson } from '../entities/lesson.entity';
import { LessonStep } from '../entities/lesson-step.entity';
import { LessonStepType } from '../entities/lesson-step-type.entity';

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
  responses?: string;
}

interface LessonData {
  order: number;
  title: string;
  description: string;
  steps: StepData[];
}

interface CourseData {
  title: string;
  is_active: boolean;
  position: number;
  scope: CourseScope;
  lessons: LessonData[];
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
        const saved = await this.queryRunner.manager.save(LessonStepType, type);
        this.stepTypes.set(saved.code, saved);
        continue;
      }

      const updated = await this.queryRunner.manager.save(LessonStepType, {
        ...existing,
        description: type.description,
      });
      this.stepTypes.set(updated.code, updated);
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
            'Cuando una {{gap1}} explota una {{gap2}}, se genera un {{gap3}}.',
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
            'El hacking etico busca {{gap1}} vulnerabilidades para {{gap2}} riesgos.',
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
            'CIA significa {{gap1}}, {{gap2}} y {{gap3}}.',
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
              'El directorio raiz de Linux se llama {{gap1}}. El directorio personal de cada usuario esta en {{gap2}}/nombre. Para volver al home desde cualquier lugar usas cd {{gap3}}.',
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
            title: 'Como ubicarte en una carpeta',
            description: 'Ubicate en la carpeta Pictures, ubicada en Desktop',
            typeCode: 'CODE_COMPLETE',
            prompt:
              'Terminal simulada (Kali):\nkali@kali:~/Desktop$ {{gap1}} Pictures',
            solution: 'cd',
            options: ['cd', 'ls', 'pwd'],
            responses: `kali@kali:~/Desktop$ cd Pictures
kali@kali:~/Desktop/Pictures$`,
          },
          {
            order: 8,
            title: 'Aprendiendo a ubicarte en carpetas',
            description:
              'Escribe el comando para ubicarte en la carpeta Pictures desde Desktop',
            typeCode: 'CODE_COMPLETE_TYPED',
            prompt:
              'Terminal simulada (Kali):\nkali@kali:~/Desktop$ {{gap1}} Pictures',
            solution: 'cd',
            options: [],
            responses: `kali@kali:~/Desktop$ cd Pictures
kali@kali:~/Desktop/Pictures$`,
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

    const malwareLessons: LessonData[] = [
      {
        order: 1,
        title: 'Fundamentos de Malware',
        description: 'Tipos comunes de malware y metodos de infeccion',
        steps: [
          {
            order: 1,
            title: 'Que es malware',
            description: 'Definicion general',
            typeCode: 'THEORY',
            prompt: `Malware es software malicioso disenado para danar, interrumpir o acceder sin autorizacion a sistemas y datos.

Ejemplos frecuentes:
- Virus
- Gusanos
- Troyanos
- Ransomware
- Spyware`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Vector comun de infeccion',
            description: 'Identificar puertas de entrada',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Cual es un vector de infeccion comun en empresas?',
            solution: 'Correos de phishing con adjuntos maliciosos',
            options: [
              'Uso de HTTPS',
              'Correos de phishing con adjuntos maliciosos',
              'Actualizar sistemas',
              'Aplicar MFA',
            ],
          },
          {
            order: 3,
            title: 'Ransomware',
            description: 'Entender comportamiento tipico',
            typeCode: 'TRUE_FALSE',
            prompt:
              'El ransomware suele cifrar archivos y exigir un pago para recuperarlos.',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 4,
            title: 'Controles recomendados',
            description: 'Seleccionar mitigaciones clave',
            typeCode: 'MULTIPLE_CHOICE',
            prompt:
              'Que controles ayudan a reducir impacto de malware?',
            solution: JSON.stringify([
              'Backups probados periodicamente',
              'Segmentacion de red',
              'Capacitacion anti-phishing',
            ]),
            options: [
              'Backups probados periodicamente',
              'Segmentacion de red',
              'Capacitacion anti-phishing',
              'Desactivar todas las actualizaciones',
              'Compartir cuentas entre equipos',
            ],
          },
        ],
      },
    ];

    const vulnerabilitiesLessons: LessonData[] = [
      {
        order: 1,
        title: 'Vulnerabilidades y Riesgo',
        description: 'Que son las vulnerabilidades y las mas comunes',
        steps: [
          {
            order: 1,
            title: 'Definicion de vulnerabilidad',
            description: 'Concepto base',
            typeCode: 'THEORY',
            prompt: `Una vulnerabilidad es una debilidad tecnica, de proceso o humana que puede ser explotada por una amenaza.

No toda vulnerabilidad se explota, pero si eleva el riesgo cuando existe un vector de ataque viable.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Vulnerabilidades frecuentes',
            description: 'Casos reales comunes',
            typeCode: 'MULTIPLE_CHOICE',
            prompt:
              'Cuales son vulnerabilidades comunes en organizaciones?',
            solution: JSON.stringify([
              'Software sin parches',
              'Contrasenas debiles o reutilizadas',
              'Mala configuracion en servicios expuestos',
            ]),
            options: [
              'Software sin parches',
              'Contrasenas debiles o reutilizadas',
              'Mala configuracion en servicios expuestos',
              'Uso de cifrado fuerte',
              'Autenticacion multifactor',
            ],
          },
          {
            order: 3,
            title: 'Error de concepto',
            description: 'Validar comprension',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Si existe una vulnerabilidad, automaticamente ocurre una brecha de seguridad.',
            solution: 'false',
            options: ['true', 'false'],
          },
          {
            order: 4,
            title: 'Cadena de riesgo',
            description: 'Completar cadena conceptual',
            typeCode: 'THEORY_COMPLETE',
            prompt:
              'Cuando una {{gap1}} explota una {{gap2}}, se materializa un {{gap3}}.',
            solution: JSON.stringify([
              'amenaza',
              'vulnerabilidad',
              'riesgo',
            ]),
            options: ['amenaza', 'vulnerabilidad', 'riesgo'],
          },
        ],
      },
    ];

    const owaspTop10Lessons: LessonData[] = [
      {
        order: 1,
        title: 'OWASP Top 10',
        description: 'Principales riesgos de seguridad en aplicaciones web',
        steps: [
          {
            order: 1,
            title: 'Que es OWASP Top 10',
            description: 'Importancia del marco',
            typeCode: 'THEORY',
            prompt: `OWASP Top 10 es un listado de riesgos criticos de seguridad en aplicaciones web.

Se usa para priorizar pruebas, controles y correcciones durante el ciclo de desarrollo.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Riesgos conocidos',
            description: 'Identificar categorias',
            typeCode: 'MULTIPLE_CHOICE',
            prompt:
              'Selecciona categorias que forman parte de OWASP Top 10.',
            solution: JSON.stringify([
              'Broken Access Control',
              'Cryptographic Failures',
              'Injection',
            ]),
            options: [
              'Broken Access Control',
              'Cryptographic Failures',
              'Injection',
              'Cableado defectuoso en rack',
              'Caida electrica por tormenta',
            ],
          },
          {
            order: 3,
            title: 'Control de acceso',
            description: 'Caso practico simple',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Permitir que un usuario cambie el ID en la URL y vea datos de otro usuario es un problema de acceso.',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 4,
            title: 'Prevencion',
            description: 'Elegir buena practica',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Cual practica reduce riesgo de Injection?',
            solution: 'Usar consultas parametrizadas',
            options: [
              'Concatenar entradas del usuario en SQL',
              'Desactivar validaciones para mejorar rendimiento',
              'Usar consultas parametrizadas',
              'Mostrar errores completos en produccion',
            ],
          },
        ],
      },
    ];

    const redHatLessons: LessonData[] = [
      {
        order: 1,
        title: 'Red Team (Red Hat)',
        description: 'Perspectiva ofensiva controlada para evaluar defensas',
        steps: [
          {
            order: 1,
            title: 'Rol del Red Team',
            description: 'Objetivo y alcance',
            typeCode: 'THEORY',
            prompt: `Un equipo Red Team simula ataques reales para medir la capacidad de deteccion y respuesta.

Siempre debe operar con autorizacion, alcance definido y reglas de compromiso.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Actividad principal',
            description: 'Seleccionar actividad propia',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Cual actividad corresponde al Red Team?',
            solution: 'Emular tecnicas de adversarios para probar controles',
            options: [
              'Administrar vacaciones de personal',
              'Emular tecnicas de adversarios para probar controles',
              'Disenar branding corporativo',
              'Cambiar politicas contables',
            ],
          },
          {
            order: 3,
            title: 'Etica y legalidad',
            description: 'Principio clave',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Un ejercicio Red Team sin autorizacion puede constituir una actividad ilegal.',
            solution: 'true',
            options: ['true', 'false'],
          },
        ],
      },
    ];

    const blueHat1Lessons: LessonData[] = [
      {
        order: 1,
        title: 'Blue Team 1 - Monitoreo y Deteccion',
        description: 'Fundamentos operativos de defensa',
        steps: [
          {
            order: 1,
            title: 'Rol del Blue Team',
            description: 'Mision principal',
            typeCode: 'THEORY',
            prompt: `Blue Team defiende los activos de la organizacion mediante monitoreo continuo, deteccion temprana y contencion.

Su trabajo depende de visibilidad, telemetria y procedimientos claros.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Herramientas clave',
            description: 'Seleccionar herramientas defensivas',
            typeCode: 'MULTIPLE_CHOICE',
            prompt:
              'Que herramientas son tipicas del Blue Team?',
            solution: JSON.stringify([
              'SIEM',
              'EDR',
              'Sistemas de gestion de logs',
            ]),
            options: [
              'SIEM',
              'EDR',
              'Sistemas de gestion de logs',
              'Editor de video',
              'Plataforma de diseno grafico',
            ],
          },
          {
            order: 3,
            title: 'Indicadores de compromiso',
            description: 'Concepto rapido',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Un IOC puede ser una IP maliciosa, hash sospechoso o dominio usado en phishing.',
            solution: 'true',
            options: ['true', 'false'],
          },
        ],
      },
    ];

    const blueHat2Lessons: LessonData[] = [
      {
        order: 1,
        title: 'Blue Team 2 - Respuesta a Incidentes',
        description: 'Proceso de respuesta y recuperacion',
        steps: [
          {
            order: 1,
            title: 'Fases de respuesta',
            description: 'Modelo general',
            typeCode: 'THEORY',
            prompt: `Un proceso comun de respuesta incluye:
- Preparacion
- Deteccion y analisis
- Contencion
- Erradicacion
- Recuperacion
- Lecciones aprendidas`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Contencion',
            description: 'Accion inmediata',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Ante un endpoint comprometido, cual es una accion de contencion inicial?',
            solution: 'Aislar el endpoint de la red',
            options: [
              'Publicar el incidente en redes sociales',
              'Apagar todos los sistemas sin analisis',
              'Aislar el endpoint de la red',
              'Borrar evidencia sin respaldo',
            ],
          },
          {
            order: 3,
            title: 'Lecciones aprendidas',
            description: 'Cierre del incidente',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Documentar hallazgos y acciones correctivas es parte esencial del cierre de un incidente.',
            solution: 'true',
            options: ['true', 'false'],
          },
        ],
      },
    ];

    const purpleHatLessons: LessonData[] = [
      {
        order: 1,
        title: 'Purple Team (Purple Hat)',
        description: 'Colaboracion entre Red Team y Blue Team',
        steps: [
          {
            order: 1,
            title: 'Que es Purple Team',
            description: 'Objetivo colaborativo',
            typeCode: 'THEORY',
            prompt: `Purple Team integra capacidades ofensivas y defensivas para acelerar mejoras de seguridad.

No reemplaza a Red o Blue: los coordina para aprender y ajustar controles mas rapido.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Beneficio principal',
            description: 'Elegir impacto correcto',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Cual es el mayor beneficio del enfoque Purple Team?',
            solution: 'Reducir brechas entre ataque simulado y mejora defensiva',
            options: [
              'Eliminar completamente todos los incidentes',
              'Reducir brechas entre ataque simulado y mejora defensiva',
              'Evitar documentar pruebas',
              'Trabajar sin indicadores de exito',
            ],
          },
          {
            order: 3,
            title: 'Trabajo conjunto',
            description: 'Validar colaboracion',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Una practica Purple Team incluye que Blue Team valide detecciones mientras Red Team ejecuta tecnicas controladas.',
            solution: 'true',
            options: ['true', 'false'],
          },
        ],
      },
    ];

    const osiLessons: LessonData[] = [
      {
        order: 1,
        title: 'Modelo OSI y Ciberseguridad',
        description: 'Capas OSI aplicadas al analisis de seguridad',
        steps: [
          {
            order: 1,
            title: 'Estructura de OSI',
            description: 'Capas del modelo',
            typeCode: 'THEORY',
            prompt: `El modelo OSI tiene 7 capas: Fisica, Enlace, Red, Transporte, Sesion, Presentacion y Aplicacion.

Ayuda a ubicar fallas y controles de seguridad por nivel.`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Relacion protocolo-capa',
            description: 'Ejemplo practico',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'En que capa OSI se ubica principalmente el protocolo IP?',
            solution: 'Capa de Red',
            options: [
              'Capa Fisica',
              'Capa de Enlace',
              'Capa de Red',
              'Capa de Aplicacion',
            ],
          },
          {
            order: 3,
            title: 'Puertos y transporte',
            description: 'Concepto de capa 4',
            typeCode: 'TRUE_FALSE',
            prompt:
              'TCP y UDP se asocian principalmente con la capa de Transporte.',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 4,
            title: 'Capas clave',
            description: 'Completar trio',
            typeCode: 'THEORY_COMPLETE',
            prompt:
              'En OSI, {{gap1}} y {{gap2}} pertenecen a la capa de Transporte y {{gap3}} a la capa de Red.',
            solution: JSON.stringify(['TCP', 'UDP', 'IP']),
            options: ['TCP', 'UDP', 'IP'],
          },
        ],
      },
    ];

    const cyberLawLessons: LessonData[] = [
      {
        order: 1,
        title: 'Leyes, Cumplimiento y Etica',
        description: 'Marco legal basico en ciberseguridad',
        steps: [
          {
            order: 1,
            title: 'Base legal',
            description: 'Importancia del cumplimiento',
            typeCode: 'THEORY',
            prompt: `La ciberseguridad no es solo tecnica: tambien exige cumplimiento legal y etico.

Aspectos frecuentes:
- Proteccion de datos personales
- Notificacion de incidentes
- Evidencia digital y cadena de custodia
- Autorizacion para pruebas de seguridad`,
            solution: '',
            options: [],
          },
          {
            order: 2,
            title: 'Consentimiento y pruebas',
            description: 'Principio juridico',
            typeCode: 'TRUE_FALSE',
            prompt:
              'Realizar pruebas de penetracion sin autorizacion explicita puede generar responsabilidad legal.',
            solution: 'true',
            options: ['true', 'false'],
          },
          {
            order: 3,
            title: 'Datos personales',
            description: 'Buena practica minima',
            typeCode: 'SINGLE_CHOICE',
            prompt:
              'Que practica ayuda al cumplimiento en proteccion de datos?',
            solution: 'Aplicar minimo privilegio y control de acceso',
            options: [
              'Compartir cuentas para agilizar procesos',
              'Aplicar minimo privilegio y control de acceso',
              'Publicar datos en entornos de prueba sin anonimizar',
              'Desactivar auditorias de acceso',
            ],
          },
          {
            order: 4,
            title: 'Normas de referencia',
            description: 'Seleccionar estandares utiles',
            typeCode: 'MULTIPLE_CHOICE',
            prompt:
              'Que marcos suelen usarse como referencia de cumplimiento y gestion de seguridad?',
            solution: JSON.stringify([
              'ISO/IEC 27001',
              'NIST Cybersecurity Framework',
              'Politicas internas de seguridad',
            ]),
            options: [
              'ISO/IEC 27001',
              'NIST Cybersecurity Framework',
              'Politicas internas de seguridad',
              'Ignorar registros para proteger privacidad',
              'Permitir accesos compartidos sin trazabilidad',
            ],
          },
        ],
      },
    ];

    const buildCyberLesson = (
      order: number,
      title: string,
      description: string,
    ): LessonData => ({
      order,
      title,
      description,
      steps: [
        {
          order: 1,
          title: `Introduccion - ${title}`,
          description: 'Fundamento teorico inicial',
          typeCode: 'THEORY',
          prompt: `En esta leccion revisamos el tema "${title}" y su impacto en ciberseguridad.

El objetivo es comprender conceptos base, riesgos asociados y buenas practicas para reducir exposicion.`,
          solution: '',
          options: [],
        },
        {
          order: 2,
          title: `Principios clave - ${title}`,
          description: 'Marco teorico aplicado',
          typeCode: 'THEORY',
          prompt: `Principios recomendados para "${title}":
- Prevencion y monitoreo continuo
- Evaluacion periodica de controles
- Mejora continua basada en incidentes y evidencia`,
          solution: '',
          options: [],
        },
        {
          order: 3,
          title: `Evaluacion conceptual - ${title}`,
          description: 'Seleccion unica',
          typeCode: 'SINGLE_CHOICE',
          prompt:
            `Cual opcion describe mejor la aplicacion de "${title}" en una organizacion?`,
          solution: 'Identificar riesgos, aplicar controles y validar resultados',
          options: [
            'Ignorar riesgos mientras no haya incidentes visibles',
            'Identificar riesgos, aplicar controles y validar resultados',
            'Aplicar controles una sola vez sin seguimiento',
            'Delegar seguridad solo al area de TI sin politicas',
          ],
        },
        {
          order: 4,
          title: `Validacion de criterio - ${title}`,
          description: 'Verdadero o falso',
          typeCode: 'TRUE_FALSE',
          prompt:
            `El tema "${title}" requiere enfoque tecnico y tambien procesos de gestion para ser efectivo.`,
          solution: 'true',
          options: ['true', 'false'],
        },
        {
          order: 5,
          title: `Buenas practicas - ${title}`,
          description: 'Seleccion multiple',
          typeCode: 'MULTIPLE_CHOICE',
          prompt:
            `Que acciones fortalecen la implementacion de "${title}"?`,
          solution: JSON.stringify([
            'Definir procedimientos claros',
            'Capacitar al personal periodicamente',
            'Medir resultados con indicadores',
          ]),
          options: [
            'Definir procedimientos claros',
            'Capacitar al personal periodicamente',
            'Medir resultados con indicadores',
            'Eliminar registros de auditoria',
            'Compartir credenciales entre usuarios',
          ],
        },
      ],
    });

    const buildCyberCourseLessons = (
      lessons: Array<{ title: string; description: string }>,
    ): LessonData[] =>
      lessons.map((lesson, index) =>
        buildCyberLesson(index + 1, lesson.title, lesson.description),
      );

    const course1ExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Introduccion a la seguridad informatica',
        description: 'Panorama general de proteccion de sistemas y datos',
      },
      {
        title: 'Amenazas en entornos digitales',
        description: 'Tipos de amenazas internas y externas',
      },
      {
        title: 'Vulnerabilidades y superficie de ataque',
        description: 'Debilidades tecnicas, humanas y de configuracion',
      },
      {
        title: 'Triada CIA aplicada',
        description: 'Confidencialidad, integridad y disponibilidad',
      },
      {
        title: 'Controles de seguridad esenciales',
        description: 'Controles preventivos, detectivos y correctivos',
      },
    ]);

    const malwareExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Clasificacion de malware',
        description: 'Virus, gusanos, troyanos y spyware',
      },
      {
        title: 'Ransomware y extorsion digital',
        description: 'Impacto operativo y financiero',
      },
      {
        title: 'Vectores de infeccion comunes',
        description: 'Phishing, adjuntos y software comprometido',
      },
      {
        title: 'Deteccion y contencion inicial',
        description: 'Respuesta temprana ante infecciones',
      },
      {
        title: 'Prevencion y resiliencia',
        description: 'Backups, segmentacion y hardening',
      },
    ]);

    const vulnerabilitiesExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Que es una vulnerabilidad',
        description: 'Concepto y relacion con riesgo',
      },
      {
        title: 'Vulnerabilidades de configuracion',
        description: 'Errores frecuentes en sistemas expuestos',
      },
      {
        title: 'Vulnerabilidades de software sin parches',
        description: 'Importancia de actualizaciones y gestion de parches',
      },
      {
        title: 'Debilidades en autenticacion',
        description: 'Contrasenas, MFA y control de acceso',
      },
      {
        title: 'Priorizacion por severidad',
        description: 'Evaluacion basada en impacto y probabilidad',
      },
    ]);

    const owaspExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Introduccion a OWASP Top 10',
        description: 'Marco de riesgos en aplicaciones web',
      },
      {
        title: 'Broken Access Control',
        description: 'Problemas de autorizacion y exposicion de datos',
      },
      {
        title: 'Injection',
        description: 'Inyecciones SQL y entradas no confiables',
      },
      {
        title: 'Cryptographic Failures',
        description: 'Errores en cifrado y manejo de secretos',
      },
      {
        title: 'Security Misconfiguration',
        description: 'Configuraciones inseguras en despliegues',
      },
    ]);

    const redHatExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Rol del Red Team',
        description: 'Objetivos ofensivos controlados',
      },
      {
        title: 'Reconocimiento y enumeracion',
        description: 'Recoleccion de informacion para simulaciones',
      },
      {
        title: 'Explotacion controlada',
        description: 'Validacion de debilidades en alcance autorizado',
      },
      {
        title: 'Post-explotacion y evidencia',
        description: 'Registro de impacto y rutas de ataque',
      },
      {
        title: 'Reporte ejecutivo y tecnico',
        description: 'Hallazgos, riesgo y plan de remediacion',
      },
    ]);

    const blueHat1ExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Fundamentos del Blue Team',
        description: 'Defensa operativa y visibilidad',
      },
      {
        title: 'Monitoreo continuo',
        description: 'Alertas, eventos y correlacion',
      },
      {
        title: 'SIEM y gestion de logs',
        description: 'Centralizacion y analisis de telemetria',
      },
      {
        title: 'Deteccion basada en indicadores',
        description: 'IOC, reglas y contexto de amenaza',
      },
      {
        title: 'Madurez defensiva',
        description: 'Metricas y mejora continua',
      },
    ]);

    const blueHat2ExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Proceso de respuesta a incidentes',
        description: 'Fases y coordinacion operativa',
      },
      {
        title: 'Triage y clasificacion',
        description: 'Priorizacion por criticidad',
      },
      {
        title: 'Contencion y erradicacion',
        description: 'Aislamiento y eliminacion de amenaza',
      },
      {
        title: 'Recuperacion segura',
        description: 'Restablecimiento con validaciones',
      },
      {
        title: 'Lecciones aprendidas',
        description: 'Analisis post-incidente y mejoras',
      },
    ]);

    const purpleHatExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Introduccion al Purple Team',
        description: 'Sinergia ofensiva y defensiva',
      },
      {
        title: 'Planeacion de ejercicios colaborativos',
        description: 'Escenarios, alcance y objetivos',
      },
      {
        title: 'Validacion de detecciones',
        description: 'Pruebas conjuntas Red y Blue',
      },
      {
        title: 'Ajuste de controles',
        description: 'Mejora de reglas, procesos y cobertura',
      },
      {
        title: 'Ciclo de mejora continua',
        description: 'Retroalimentacion basada en evidencias',
      },
    ]);

    const osiExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Capas del modelo OSI',
        description: 'Estructura y utilidad del modelo',
      },
      {
        title: 'Capa de red y transporte',
        description: 'IP, TCP y UDP en analisis de trafico',
      },
      {
        title: 'Capa de aplicacion y protocolos',
        description: 'HTTP, DNS y servicios expuestos',
      },
      {
        title: 'Controles por capa',
        description: 'Medidas de seguridad en cada nivel',
      },
      {
        title: 'Diagnostico de incidentes con OSI',
        description: 'Aislamiento de fallas y trazabilidad',
      },
    ]);

    const cyberLawExtendedLessons = buildCyberCourseLessons([
      {
        title: 'Marco legal en ciberseguridad',
        description: 'Principios juridicos basicos',
      },
      {
        title: 'Proteccion de datos personales',
        description: 'Responsabilidades y tratamiento de datos',
      },
      {
        title: 'Delitos informaticos',
        description: 'Conductas sancionables y evidencia',
      },
      {
        title: 'Cumplimiento normativo',
        description: 'Politicas, auditoria y trazabilidad',
      },
      {
        title: 'Etica profesional en seguridad',
        description: 'Autorizacion, alcance y responsabilidad',
      },
    ]);

    console.log('            Upserting courses...');

    const coursesToSeed: CourseData[] = [
      {
        title: 'Fundamentos de la seguridad informatica',
        is_active: true,
        position: 1,
        scope: CourseScope.NATIVE,
        lessons: course1ExtendedLessons,
      },
      {
        title: 'Introduccion a Linux',
        is_active: true,
        position: 2,
        scope: CourseScope.NATIVE,
        lessons: course2Lessons,
      },
      {
        title: 'Curso inactivo',
        is_active: false,
        position: 3,
        scope: CourseScope.NATIVE,
        lessons: [],
      },
      {
        title: 'Malware y amenazas comunes',
        is_active: true,
        position: 4,
        scope: CourseScope.NATIVE,
        lessons: malwareExtendedLessons,
      },
      {
        title: 'Vulnerabilidades comunes',
        is_active: true,
        position: 5,
        scope: CourseScope.NATIVE,
        lessons: vulnerabilitiesExtendedLessons,
      },
      {
        title: 'OWASP Top 10',
        is_active: true,
        position: 6,
        scope: CourseScope.NATIVE,
        lessons: owaspExtendedLessons,
      },
      {
        title: 'Red Hat - ofensiva controlada',
        is_active: true,
        position: 7,
        scope: CourseScope.NATIVE,
        lessons: redHatExtendedLessons,
      },
      {
        title: 'Blue Hat 1 - monitoreo',
        is_active: true,
        position: 8,
        scope: CourseScope.NATIVE,
        lessons: blueHat1ExtendedLessons,
      },
      {
        title: 'Blue Hat 2 - respuesta',
        is_active: true,
        position: 9,
        scope: CourseScope.NATIVE,
        lessons: blueHat2ExtendedLessons,
      },
      {
        title: 'Purple Hat - colaboracion defensiva',
        is_active: true,
        position: 10,
        scope: CourseScope.NATIVE,
        lessons: purpleHatExtendedLessons,
      },
      {
        title: 'Modelo OSI para ciberseguridad',
        is_active: true,
        position: 11,
        scope: CourseScope.NATIVE,
        lessons: osiExtendedLessons,
      },
      {
        title: 'Leyes y cumplimiento en ciberseguridad',
        is_active: true,
        position: 12,
        scope: CourseScope.NATIVE,
        lessons: cyberLawExtendedLessons,
      },
    ];

    for (const courseData of coursesToSeed) {
      const course = await this.upsertCourse(courseData);
      await Promise.all(
        courseData.lessons.map((lessonData) =>
          this.createOrUpdateLesson(course, lessonData),
        ),
      );

      console.log(
        `            Course "${courseData.title}": upserted ${courseData.lessons.length} lessons with ${courseData.lessons.reduce((sum, l) => sum + l.steps.length, 0)} steps`,
      );
    }
  }

  private async upsertCourse(courseData: CourseData): Promise<Course> {
    const existing = await this.queryRunner.manager.findOne(Course, {
      where: [
        { scope: courseData.scope, position: courseData.position },
        { scope: courseData.scope, title: courseData.title },
      ],
    });

    if (!existing) {
      return this.queryRunner.manager.save(Course, {
        title: courseData.title,
        is_active: courseData.is_active,
        position: courseData.position,
        scope: courseData.scope,
      });
    }

    return this.queryRunner.manager.save(Course, {
      ...existing,
      title: courseData.title,
      is_active: courseData.is_active,
      position: courseData.position,
      scope: courseData.scope,
    });
  }

  private async createOrUpdateLesson(
    course: Course,
    lessonData: LessonData,
  ): Promise<void> {
    const existingLesson = await this.queryRunner.manager.findOne(Lesson, {
      where: { course: { id: course.id }, order: lessonData.order },
    });

    const lesson = await this.queryRunner.manager.save(Lesson, {
      ...existingLesson,
      title: lessonData.title,
      description: lessonData.description,
      course,
      order: lessonData.order,
      is_active: true,
    });

    await Promise.all(
      lessonData.steps.map(async (stepData) => {
        const stepType = this.stepTypes.get(stepData.typeCode);
        const existingStep = await this.queryRunner.manager.findOne(LessonStep, {
          where: { lesson: { id: lesson.id }, order: stepData.order },
        });

        return this.queryRunner.manager.save(LessonStep, {
          ...existingStep,
          title: stepData.title,
          description: stepData.description,
          lesson,
          order: stepData.order,
          prompt: stepData.prompt,
          solution: stepData.solution,
          options: JSON.stringify(stepData.options),
          responses: stepData.responses ?? null,
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

export async function runCoursesSeeder(): Promise<void> {
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

