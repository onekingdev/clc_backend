import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Earnings extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    questionID: number;

    @Column()
    tickets: number;

    @Column()
    chips: number;

    @Column()
    createdAt: Date;
}