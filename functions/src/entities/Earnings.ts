import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Earnings extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userID: number;

    @Column()
    questionID: number;

    @Column()
    tickets: number;

    @Column()
    chips: number;

    @Column()
    challenge: number;

    @Column()
    correct: number;

    @Column({ default: () => `now()` })
    createdAt: Date;
}