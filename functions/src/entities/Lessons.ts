import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Lessons extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    topicID: number;

    @Column()
    name: string;

    @Column()
    createdAt: Date;
}