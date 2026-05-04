import { ConfigService } from '@nestjs/config';
export declare class WebhooksService {
    private readonly config;
    private readonly log;
    constructor(config: ConfigService);
    dispatch(url: string | null | undefined, event: string, payload: Record<string, unknown>): Promise<void>;
}
