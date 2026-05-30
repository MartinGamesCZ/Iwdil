import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RemindersService } from './reminders.service';

@Processor('quick-reminders', {
  concurrency: 1,
})
export class RemindersProcessor extends WorkerHost {
  constructor(private readonly remindersService: RemindersService) {
    super();
  }

  async process(job: Job<{ reminderId: string }>): Promise<void> {
    const { reminderId } = job.data;

    try {
      await this.remindersService.quickProcess(reminderId);
    } catch (e) {
      console.error(e);

      throw e;
    }
  }
}
