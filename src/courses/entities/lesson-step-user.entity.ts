import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Unique,
} from 'typeorm';
import { ProgressEnum } from 'src/common/lib/const';
import { LessonStep } from './lesson-step.entity';
import { UserLesson } from './lesson-user.entity';

@Entity('user_step')
@Unique(['user_lesson', 'step'])
export class UserStep {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserLesson, (userLesson) => userLesson.user_steps, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_lesson_id' })
    user_lesson: UserLesson;

    @ManyToOne(() => LessonStep, (lessonStep) => lessonStep.user_steps, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'step_id' })
    step: LessonStep;

    @Column({
        type: 'enum',
        enum: ProgressEnum,
        default: ProgressEnum.NOT_STARTED,
    })
    progress: ProgressEnum;

    @Column({
        type: 'boolean',
        nullable: true,
    })
    is_correct: boolean;

    @Column({
        type: 'varchar',
        nullable: true,
    })
    answer: string | null;

    @Column({
        type: 'boolean',
        default: false,
    })
    is_answered: boolean;

    @Column({
        type: 'int',
        default: 0,
    })
    attempts_count: number;

    @Column({
        type: 'int',
        default: 0,
    })
    medals_earned: number;

    @CreateDateColumn()
    started_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
