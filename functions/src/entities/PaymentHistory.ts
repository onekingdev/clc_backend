import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class PaymentHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  action: boolean;

  @Column()
  createdAt: Date;

  @Column()
  amount: number;
  
  @Column()
  amount_captured: number;

  @Column()
  payment_id: string;

  @Column()
  customer_id: string;

}
