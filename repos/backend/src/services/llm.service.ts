import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama';

@Injectable()
export class LlmService {
  #ollama: Ollama;

  constructor() {
    this.#ollama = new Ollama({
      host: 'https://ollama.notiar.app',
    });
  }

  async ask(message: string) {
    const res = await this.#ollama.chat({
      model: 'gemma3:4b',
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      format: 'json',
      keep_alive: -1,
    });

    return res.message;
  }
}
