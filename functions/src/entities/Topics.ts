import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Topics extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    rank: number;

    @Column()
    chips: number;

    @Column()
    tickets: number;

    @Column()
    createdAt: Date;
}