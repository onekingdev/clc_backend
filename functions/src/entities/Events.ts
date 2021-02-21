import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Events extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    date: string;

    @Column('longtext')
    body: string;

    @Column()
    link: string;

    @Column()
    spotlight: number;
}