import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { OTPEnum } from '../types/otp-type.enum';

@Entity('otps')
export class Otp {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    code: string;

    @Column({
        type: 'enum',
        enum: OTPEnum,
    })
    type: OTPEnum;

    @Column()
    expires: Date;

    @Column({ default: false })
    verified: boolean;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;
}
