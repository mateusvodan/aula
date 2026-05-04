import type { Database } from '../../database/drizzle.factory.js';
export declare class UsersService {
    private readonly db;
    constructor(db: Database);
    getProfile(userId: string): Promise<any>;
}
