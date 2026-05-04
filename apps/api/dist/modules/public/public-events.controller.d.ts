import { EventsService } from '../events/events.service.js';
import { LeadsService } from '../leads/leads.service.js';
import { CreatePublicEventDto } from './public.dto.js';
export declare class PublicEventsController {
    private readonly events;
    private readonly leads;
    constructor(events: EventsService, leads: LeadsService);
    create(dto: CreatePublicEventDto): Promise<{
        ok: boolean;
    }>;
}
