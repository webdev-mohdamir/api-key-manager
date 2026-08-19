import { InjectRedis } from "@nestjs-modules/ioredis";
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { Observable } from "rxjs";


@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly configService: ConfigService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKeyId = request.apiKeyId;
        
        const maxRequests = this.configService.getOrThrow<number>('RATE_LIMIT_MAX');     
        const windowSeconds = this.configService.getOrThrow<number>('RATE_LIMIT_WINDOW_SECONDS'); 
        
        const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);

        const redisKey = `ratelimit:${apiKeyId}:${currentWindow}`;
    
        const currentRequests = await this.redis.incr(redisKey);
        
        if (currentRequests === 1) {
            await this.redis.expire(redisKey, windowSeconds);
        }

        if (currentRequests > maxRequests) {
            throw new HttpException({
                status: HttpStatus.TOO_MANY_REQUESTS,
                error: 'Too Many Requests',
                message: 'You have exceeded your request limit. Please try again later.',
            }, HttpStatus.TOO_MANY_REQUESTS);
        }

        return true;
    }
}