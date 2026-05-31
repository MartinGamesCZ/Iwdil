import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchProcessor } from './search.processor';
import { BullModule } from '@nestjs/bullmq';
import { LlmService } from 'src/services/llm.service';
import { SearxngService } from 'src/services/searxng.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'search',
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchProcessor, LlmService, SearxngService],
})
export class SearchModule {}
