import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class ActivationCodes extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  active: boolean;

  @Column()
  createdAt: Date;

  @Column()
  trailDays: number;

  @Column()
  role: string;

  @Column()
  isAssessment: boolean;
}
