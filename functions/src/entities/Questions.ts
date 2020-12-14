import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Questions extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    lessonID: number;

    @Column()
    questionText: string;

    @Column("simple-json")
    Answers: { correct: string, wrong1: string, wrong2: string, wrong3: string };

    @Column("simple-json")
    explanation: { correct: string, wrong: string };

    @Column()
    createdAt: Date;
}