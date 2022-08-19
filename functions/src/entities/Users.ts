import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    // OneToMany
} from 'typeorm';
// import { LibraryWatchingStatus } from './LibraryWatchingStatus';

@Entity()
export class Users extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    stringID: string;

    @Column()
    assessment: boolean;

    @Column()
    activationCodeID: number;

    @Column()
    avatar: string;

    @Column()
    userName: string;

    @Column()
    email: string;
    
    @Column()
    referEmail: string;

    @Column()
    type: string; // admin, free, premium

    @Column()
    masteredLevel: number;

    @Column()
    createdAt: Date;

    @Column()
    lastLoginAt: Date;
    
    @Column("simple-json")
    path: {
        availableTopics: string[],
        masteredTopics: string[],
        masteredLessons: string[],
        lockedTopics: string[]
    }

    @Column("simple-json")
    payment: {
        id?: string,
        subscriptionID?: string,
        customerID?: string,
        created?: number,
        amount?: number,
        scheduled?: boolean,
        subscription?: Date,
        subscriptionType?: string,
        subscriptionInterval?: string,
        canceled?: boolean,
        price?: number,
        paymentMethod?: {
            id: string,
            brand: string,
            expMonth: string,
            expYear: string,
            last4: string
        }
    };

    // @OneToMany(() => LibraryWatchingStatus, (libraryWatchingStatus: LibraryWatchingStatus) => libraryWatchingStatus.user, { cascade: true })
    // libraryWatchingStatus: LibraryWatchingStatus[];
}