import { Injectable } from '@nestjs/common';
import * as searxng from 'searxng';

@Injectable()
export class SearxngService {
  #searxng: searxng.SearxngService;

  constructor() {
    this.#searxng = new searxng.SearxngService({
      baseURL: 'https://searxng.cloud.martinpetr.dev',
      defaultSearchParams: {
        format: 'json',
        lang: 'auto',
      },
      defaultRequestHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  async search(query: string) {
    const res = await this.#searxng.search(query, {
      engines: ['startpage', 'duckduckgo', 'brave', 'bing'],
    });

    console.log(res);

    return res;
  }
}
