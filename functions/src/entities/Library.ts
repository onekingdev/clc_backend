import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    OneToMany,
    // OneToMany
} from 'typeorm';
import { LibraryWatchingStatus } from './LibraryWatchingStatus';
// import { LibraryWatchingStatus } from './LibraryWatchingStatus';

@Entity()
export class Library extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    image: string;

    @Column()
    duration: number;

    @Column()
    title: string;

    @Column('longtext')
    description: string;

    @Column()
    url: string;

    @Column()
    type: string;

    @Column({type: "int", default: 0})
    handBreakdown: number;

    @Column()
    createdAt: Date;

    @OneToMany(() => LibraryWatchingStatus, (libraryWatchingStatus: LibraryWatchingStatus) => libraryWatchingStatus.library, { cascade: true })
    libraryWatchingStatus?: LibraryWatchingStatus[];
}