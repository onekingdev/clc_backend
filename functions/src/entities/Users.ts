import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from 'typeorm';

@Entity()
export class Users extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    activationCodeID: number;

    @Column()
    avatar: number;

    @Column()
    userName: string;

    @Column()
    email: string;

    @Column()
    type: string; // admin, free, premium

    @Column()
    masteredLevel: number;

    @Column()
    createdAt: Date;
}