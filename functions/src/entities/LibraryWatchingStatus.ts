import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LibraryWatchingStatus extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  libraryId: number;
  
  @Column()
  userId: number;

  @Column()
  createdAt: Date;
}
