import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Library extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    image: string;

    @Column()
    duration: number;

    @Column()
    title: string;

    @Column('longtext')
    description: string;

    @Column()
    url: string;

    @Column()
    type: string; // usage, faq

    @Column()
    createdAt: Date;
}