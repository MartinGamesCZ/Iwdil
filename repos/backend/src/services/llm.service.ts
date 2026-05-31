import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Message, Ollama } from 'ollama';

function sanitizeSurrogates(str: string): string {
  if (typeof (str as any).toWellFormed === 'function')
    return (str as any).toWellFormed();

  return str.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|([^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
    (_, p1) => (p1 || '') + '\uFFFD',
  );
}

@Injectable()
export class LlmService {
  #ollama: Ollama;
  #API_BASE = 'http://172.17.0.1:13305';

  constructor() {
    this.#ollama = new Ollama({
      //host: 'https://lemonade.cloud.martinpetr.dev',
      host: this.#API_BASE,
    });
  }

  async chat(messages: Message[], options?: Record<string, any>) {
    const sanitizedMessages = messages.map((m) => ({
      ...m,
      content: sanitizeSurrogates(m.content),
    }));
    const res = await this.#ollama.chat({
      //model: 'Gemma-3-4b-it-GGUF:latest',
      model: 'Qwen3-4B-GGUF:latest',
      messages: sanitizedMessages,
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

  async rerank(query: string, documents: string[]) {
    const { data } = await axios
      .post(
        `${this.#API_BASE}/api/v1/reranking`,
        {
          model: 'bge-reranker-v2-m3-GGUF',
          query: sanitizeSurrogates(query),
          documents: documents.map((doc) => sanitizeSurrogates(doc)),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .catch((e) => {
        console.log(e.response.data);

        return { data: null };
      });

    console.log(data);

    if (!data) throw new Error('Failed to rerank documents');

    return data.results;
  }

  stripOutJson(message: string) {
    const firstBraceIndex = message.indexOf('{');
    const lastBraceIndex = message.lastIndexOf('}');

    if (firstBraceIndex === -1 || lastBraceIndex === -1)
      throw new Error('Invalid message format');

    return message.substring(firstBraceIndex, lastBraceIndex + 1);
  }
}
