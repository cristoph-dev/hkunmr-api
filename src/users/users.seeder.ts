import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { DataSource, QueryRunner } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { AuthRole } from '../common/guards/role.guard';

dotenv.config();

class UsersSeeder {
    private dataSource: DataSource;
    private queryRunner: QueryRunner;

    async initialize(): Promise<void> {
        if (!process.env.ADMIN_USERPASS) {
            console.error('Please provide an admin password');
            process.exit(1);
        }

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

            const roles = await this.seedRoles();
            await this.seedUsers(roles);

            console.log('[3/4] Committing transaction...');
            await this.queryRunner.commitTransaction();
            console.log('      Transaction committed successfully');

            console.log('\nSeeding process completed successfully');
        } catch (error) {
            console.error('[ERROR] Seeding failed, rolling back transaction...');
            await this.queryRunner.rollbackTransaction();
            console.error('        Transaction rolled back');
            throw error;
        }
    }

    private async seedRoles(): Promise<Map<string, Role>> {
        console.log('\n      [2.1] Seeding roles...');

        const roleData = [
            { description: AuthRole.Admins, is_active: true },
            { description: AuthRole.Student, is_active: true },
            { description: AuthRole.Teacher, is_active: true },
            // Added an inactive role for testing
            { description: 'TestInactivo' as any, is_active: false },
        ];

        const roleMap = new Map<string, Role>();

        for (const data of roleData) {
            const role = await this.queryRunner.manager.save(Role, data);
            roleMap.set(role.description, role);
        }

        console.log(`            Created ${roleData.length} roles`);
        return roleMap;
    }

    private async seedUsers(roleMap: Map<string, Role>): Promise<void> {
        console.log('\n      [2.2] Seeding users...');

        const adminRole = roleMap.get(AuthRole.Admins)!;
        const studentRole = roleMap.get(AuthRole.Student)!;
        const professorRole = roleMap.get(AuthRole.Teacher)!;

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_USERPASS!, 10);

        const users = await Promise.all([
            this.queryRunner.manager.save(User, {
                name: 'Admin',
                lastname: 'User',
                email: 'admin@hkunmr.com',
                password: hashedPassword,
                is_active: true,
                email_verified: true,
                roles: [adminRole],
            }),
            this.queryRunner.manager.save(User, {
                name: 'Student',
                lastname: 'User',
                email: 'student@hkunmr.com',
                password: hashedPassword,
                is_active: true,
                email_verified: true,
                roles: [studentRole],
            }),
            this.queryRunner.manager.save(User, {
                name: 'Professor',
                lastname: 'User',
                email: 'professor@hkunmr.com',
                password: hashedPassword,
                is_active: true,
                email_verified: true,
                roles: [professorRole],
            }),
        ]);

        console.log(`            Created ${users.length} users:`);
        users.forEach((u: any) => console.log(`              - ${u.email}`));
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
    const seeder = new UsersSeeder();

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
