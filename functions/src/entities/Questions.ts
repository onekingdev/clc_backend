import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Questions extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    lessonUID: string;

    @Column()
    questionText: string;

    @Column('longtext')
    handHistory: string;

    @Column("simple-json")
    answers: { correct: string, wrong1: string, wrong2: string, wrong3: string, wrong4: string };

    @Column("simple-json")
    explanation: { correct: string, wrong: string };

    @Column("simple-json")
    reward: {chips: number, tickets: number};

    @Column()
    assessment: number;

    @Column()
    createdAt: Date;
}