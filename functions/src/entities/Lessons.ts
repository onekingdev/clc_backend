import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Lessons extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    UID: string;

    @Column()
    topicUID: string;

    @Column()
    name: string;

    @Column()
    createdAt: Date;
}