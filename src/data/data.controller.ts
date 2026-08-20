import { Controller, Get, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { DataService } from './data.service';
import { ApiKeyGuard } from 'src/api-key/guard/api-key.guard';
import type { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { UsageLoggingInterceptor } from 'src/api-key/interceptors/usage-logging.interceptor';

@Controller('data')
export class DataController {
    constructor(
        private readonly dataService: DataService
    ) {}

    @Get("ping")
    @Public()
    @UseGuards(ApiKeyGuard, RateLimitGuard)
    @UseInterceptors(UsageLoggingInterceptor)
    async ping(@Req() req: Request) {
        return this.dataService.ping({ userId: req.userId, apiKeyId: req.apiKeyId });
    }
}
