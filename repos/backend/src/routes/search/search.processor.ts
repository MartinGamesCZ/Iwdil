import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SearchService } from './search.service';
import { ESearchSessionState } from 'src/types/search';

@Processor('search', {
  concurrency: 1,
})
export class SearchProcessor extends WorkerHost {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job<{ sessionId: string }>): Promise<void> {
    const { sessionId } = job.data;

    try {
      await this.searchService.setSessionState(
        sessionId,
        ESearchSessionState.Processing,
      );
      await this.searchService.process(sessionId);
      await this.searchService.setSessionState(
        sessionId,
        ESearchSessionState.Completed,
      );
    } catch (e) {
      await this.searchService.setSessionState(
        sessionId,
        ESearchSessionState.Failed,
      );

      console.error(e);

      throw e;
    }
  }
}
