import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { UsageLog } from "src/generated/prisma/client";

@Injectable()
export class UsageLogService {
    constructor(@InjectQueue('usage-log') private readonly logQueue: Queue) {}

    async logUsage(data: Omit<UsageLog, 'id' | 'createdAt'>) {
        await this.logQueue.add('log', data, {
            attempts: 3, // initial attempt + 2 retries
            backoff: {
                type: 'exponential',
                delay: 1000, // 1s, then 2s, then 4s between retries
            },
        });
    }
}
