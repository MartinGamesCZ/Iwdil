import { Injectable } from '@nestjs/common';
import { Message, Ollama } from 'ollama';

@Injectable()
export class LlmService {
  #ollama: Ollama;

  constructor() {
    this.#ollama = new Ollama({
      //host: 'https://lemonade.cloud.martinpetr.dev',
      host: 'http://172.17.0.1:13305',
    });
  }

  async chat(messages: Message[], options?: Record<string, any>) {
    const res = await this.#ollama.chat({
      model: 'Gemma-3-4b-it-GGUF:latest',
      messages: messages,
      options,
      keep_alive: -1,
    });

    return {
      output: res,
      // reply: (prompt: string) =>
      //   this.chat([
      //     ...messages,
      //     { role: 'assistant', content: res.message.content } as Message,
      //     { role: 'user', content: prompt } as Message,
      //   ]),
    };
  }

  stripOutJson(message: string) {
    const firstBraceIndex = message.indexOf('{');
    const lastBraceIndex = message.lastIndexOf('}');

    if (firstBraceIndex === -1 || lastBraceIndex === -1)
      throw new Error('Invalid message format');

    return message.substring(firstBraceIndex, lastBraceIndex + 1);
  }
}
