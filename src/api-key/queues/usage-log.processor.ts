import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";

@Processor('usage-log')
export class UsageLogConsumer extends WorkerHost {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'log': {
                await this.prisma.usageLog.create({ data: job.data });
                return null;
            }
            default: {
                return null;
            }
        }
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        // TODO: send this to an error-tracking/alerting service (Sentry, email, etc.)
        // once that infrastructure exists. For now, log to console so failures
        // are at least visible during local dev.
        console.error(`Usage log job ${job.id} failed after all retries:`, error.message);
    }
}