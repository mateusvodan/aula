import { LeadsService } from '../leads/leads.service.js';
import { CreatePublicLeadDto } from './public.dto.js';
export declare class PublicLeadsController {
    private readonly leads;
    constructor(leads: LeadsService);
    create(dto: CreatePublicLeadDto): Promise<any>;
}
