import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(user: {
        userId: string;
    }): Promise<any>;
}
