import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Questions extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    createdAt: Date;
}