import { Module } from '@nestjs/common';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { AuthModule } from 'src/auth/auth.module';
import { ApiKeyGuard } from './guard/api-key.guard';
import { BullModule } from '@nestjs/bullmq';
import { UsageLogService } from './queues/usage-log.queue';
import { UsageLoggingInterceptor } from './interceptors/usage-logging.interceptor';
import { UsageLogConsumer } from './queues/usage-log.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'usage-log',
    }),
    AuthModule
  ],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyGuard, UsageLogService, UsageLogConsumer, UsageLoggingInterceptor],
  exports: [ApiKeyService, ApiKeyGuard, UsageLogService, UsageLoggingInterceptor],
})
export class ApiKeyModule {}
