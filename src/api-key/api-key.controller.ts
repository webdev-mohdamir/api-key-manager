import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-api.dto';
import type { Request } from 'express';
import { ApiKeyService } from './api-key.service';

@Controller('api-key')
export class ApiKeyController {
    constructor(
        private readonly apiKeyService: ApiKeyService
    ) {}

    @Post()
    async createApiKey(
        @Body() { label }: CreateApiKeyDto,
        @Req() req: Request
    ) {
        const result = await this.apiKeyService.create({ userId: req.userId, label });
        return {
            message: 'API key created successfully. Save this key now — it will not be shown again.',
            ...result,
        };
    }

    @Get()
    async listApiKeys(@Req() req: Request) {
        const result = await this.apiKeyService.list(req.userId);
        return result;
    }

    @Delete(':id')
    async revokeApiKey(@Req() req: Request, @Param('id') id: string) {
        await this.apiKeyService.revoke(req.userId, id);
        return { message: 'API key revoked successfully' };
    }
}
