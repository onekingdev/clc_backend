import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Glossary extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    word: string;

    @Column('longtext')
    definition: string;

    @Column()
    createdAt: Date;
}