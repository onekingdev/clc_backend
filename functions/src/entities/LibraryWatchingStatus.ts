import { BaseEntity, CreateDateColumn, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Library } from "./Library";
import { Users } from "./Users";

@Entity()
export class LibraryWatchingStatus extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @ManyToOne(() => Users, (user: Users) => user.id)
  @JoinTable()
  user: Users;

  @ManyToOne(() => Library, (library: Library) => library.id)
  @JoinTable()
  library: Library;

  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;
}