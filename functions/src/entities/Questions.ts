import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity()
export class Questions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lessonUID: string;

  @Column()
  handNumber: string;

  @Column()
  questionText: string;

  @Column("longtext", { nullable: true })
  handHistory: string;

  @Column("longtext", { nullable: true })
  textContent: string;

  @Column({ nullable: true })
  imgUrl: string;

  @Column("simple-json")
  answers: {
    correct: string;
    wrong1: string;
    wrong2: string;
    wrong3: string;
    wrong4: string;
  };

  @Column("simple-json")
  explanation: { correct: string; wrong: string };

  @Column("simple-json")
  reward: { chips: number; tickets: number };

  @Column()
  assessment: number;

  @Column({ default: () => `now()` })
  createdAt: Date;
}
