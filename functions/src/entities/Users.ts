import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Users extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    activationCodeID: number;

    @Column()
    avatar: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    type: string; // admin, free, premium

    @Column()
    createdAt: Date;
}