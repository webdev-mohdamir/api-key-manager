import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DataService } from './data.service';
import { ApiKeyGuard } from 'src/api-key/guard/api-key.guard';
import type { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';

@Controller('data')
export class DataController {
    constructor(
        private readonly dataService: DataService
    ) {}

    @Get("ping")
    @Public()
    @UseGuards(ApiKeyGuard, RateLimitGuard)
    ping(@Req() req: Request) {
        return {
            message: 'pong',
            userId: req.userId,
            apiKeyId: req.apiKeyId,
        };
    }
}
