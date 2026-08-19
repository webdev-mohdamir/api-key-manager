import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { ApiKeyModule } from 'src/api-key/api-key.module';

@Module({
  imports: [ApiKeyModule],
  providers: [DataService],
  controllers: [DataController]
})
export class DataModule {}
