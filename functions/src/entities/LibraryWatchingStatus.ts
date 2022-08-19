import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Library } from "./Library";
import { Users } from "./Users";

@Entity("library-watching-status")
export class LibraryWatchingStatus extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @ManyToOne(() => Users, (user: Users) => user.id)
  user: Users;

  @ManyToOne(() => Library, (library: Library) => library.id)
  library: Library;

  @Column()
  createdAt: Date;
}
