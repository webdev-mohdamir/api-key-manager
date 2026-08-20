import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class DataService {
    public async ping({ userId, apiKeyId }: { userId: string; apiKeyId: string }): Promise<{ message: string; userId: string; apiKeyId: string }> {
        // await new Promise((resolve) => setTimeout(resolve, 1500));
        return { message: 'pong', userId, apiKeyId };
    }
}
