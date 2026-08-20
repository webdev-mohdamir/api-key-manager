import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { UsageLogService } from "../queues/usage-log.queue";

@Injectable()
export class UsageLoggingInterceptor implements NestInterceptor {
    constructor(
        private readonly usageLogService: UsageLogService
    ) { }

    private logRequest(request: any, statusCode: number, message: string, startTime: number) {
        this.usageLogService.logUsage({
            method: request.method,
            endpoint: request.url,
            responseTimeMs: Date.now() - startTime,
            statusCode,
            userId: request.userId,
            apiKeyId: request.apiKeyId,
            message,
        });
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    this.logRequest(request, response.statusCode, 'OK', startTime);
                },
                error: (err) => {
                    const statusCode = err instanceof HttpException ? err.getStatus() : 500;
                    this.logRequest(request, statusCode, err.message, startTime);
                },
            }),
        );
    }
}