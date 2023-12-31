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
    rule: string;

    @Column('longtext')
    description: string;

    @Column('int', {default: 0})
    order: number;

    @Column({ default: () => `now()` })
    createdAt: Date;
}