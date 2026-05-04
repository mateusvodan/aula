import { ConfigService } from '@nestjs/config';
export interface JwtPayload {
    sub: string;
    email?: string;
    role?: string;
}
declare const SupabaseJwtStrategy_base: any;
export declare class SupabaseJwtStrategy extends SupabaseJwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): {
        userId: string;
    };
}
export {};
