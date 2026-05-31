import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { Queue } from 'bullmq';
import { JSDOM } from 'jsdom';
import { Database } from 'src/database/database';
import { SearchMessageEntity } from 'src/database/entities/SearchMessageEntity';
import { SearchSessionEntity } from 'src/database/entities/SearchSessionEntity';
import { UserEntity } from 'src/database/entities/UserEntity';
import { IAuthInfo } from 'src/decorators/auth/AuthInfo.decorator';
import {
  SearchGetQueriesPrompt,
  SearchRespondPrompt,
} from 'src/prompts/search';
import { LlmService } from 'src/services/llm.service';
import { Readability } from '@mozilla/readability';
import { SearxngService } from 'src/services/searxng.service';
import { ESearchSessionState } from 'src/types/search';
import { SearchDocumentEntity } from 'src/database/entities/SearchDocumentEntity';
import { Observable, Subscriber } from 'rxjs';
import { AuthInfo } from 'src/utils/bearer';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  #channelSubscribers: Map<string, Subscriber<MessageEvent>[]> = new Map();

  constructor(
    @InjectQueue('search')
    private readonly searchQueue: Queue,
    private readonly llmService: LlmService,
    private readonly searxngService: SearxngService,
  ) {}

  async createSession(authInfo: IAuthInfo, query: string) {
    if (!query || typeof query != 'string' || query.trim().length <= 0)
      throw new BadRequestException('Invalid query');

    const user = await this.#getUserById(authInfo.sub);

    const session = new SearchSessionEntity();
    session.user = user;

    const savedSession =
      await Database.get<SearchSessionEntity>().save(session);

    const message = new SearchMessageEntity();
    message.role = 'user';
    message.content = query;
    message.session = savedSession;

    await Database.get<SearchMessageEntity>().save(message);

    this.logger.log(
      `User ${authInfo.sub} created search session ${savedSession.id}`,
    );

    await this.searchQueue.add('search', { sessionId: savedSession.id });

    return await Database.get<SearchSessionEntity>().findOne({
      where: {
        id: savedSession.id,
      },
      relations: {
        user: true,
        messages: true,
        documents: true,
      },
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });
  }

  async getSession(authInfo: IAuthInfo, sessionId: string) {
    const user = await this.#getUserById(authInfo.sub);

    const session = await Database.get<SearchSessionEntity>().findOne({
      where: {
        id: sessionId,
        user: {
          id: user.id,
        },
      },
      relations: {
        user: true,
        messages: true,
        documents: true,
      },
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });
    if (!session) throw new BadRequestException('Invalid session id');

    return session;
  }

  async #getSessionById(sessionId: string) {
    const session = await Database.get<SearchSessionEntity>().findOne({
      where: {
        id: sessionId,
      },
      relations: {
        user: true,
        messages: true,
        documents: true,
      },
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });
    if (!session) throw new BadRequestException('Invalid session id');

    return session;
  }

  async setSessionState(sessionId: string, state: ESearchSessionState) {
    const session = await this.#getSessionById(sessionId);
    session.state = state;

    await Database.get<SearchSessionEntity>().save(session);
  }

  async process(sessionId: string) {
    const session = await this.#getSessionById(sessionId);

    this.logger.log(`Processing search session ${sessionId}`);
    this.#notifySubscribers(sessionId, {
      type: 'progress',
      data: session,
    });

    const { results, rerankingQuery } =
      await this.#processSearchStep(sessionId);
    this.#notifySubscribers(sessionId, {
      type: 'progress',
      data: await this.#getSessionById(sessionId),
    });
    this.logger.log(`Search step completed for session ${sessionId}`);

    const documents = await this.#interpretSearchResults(
      rerankingQuery,
      results,
    );
    this.logger.log(`Interpret search step completed for session ${sessionId}`);

    await this.#saveDocuments(sessionId, documents);
    this.#notifySubscribers(sessionId, {
      type: 'progress',
      data: await this.#getSessionById(sessionId),
    });

    await this.#processRespondStep(sessionId, documents);
    this.logger.log(`Respond step completed for session ${sessionId}`);
    this.#notifySubscribers(sessionId, {
      type: 'progress',
      data: await this.#getSessionById(sessionId),
    });
  }

  async #saveDocuments(
    sessionId: string,
    documents: { url: string; content: string }[],
  ) {
    const session = await this.#getSessionById(sessionId);

    for (const { url, content } of documents) {
      const documentEntity = new SearchDocumentEntity();
      documentEntity.url = url;
      documentEntity.chunk = content;
      documentEntity.session = session;

      await Database.get<SearchDocumentEntity>().save(documentEntity);
    }
  }

  async #processRespondStep(
    sessionId: string,
    documents: {
      url: string;
      content: string;
    }[],
  ) {
    const session = await this.#getSessionById(sessionId);

    const result = await this.llmService.chat([
      {
        role: 'system',
        content: SearchRespondPrompt(documents),
      },
      session.messages[0],
    ]);

    const message = new SearchMessageEntity();
    message.session = session;
    message.role = 'assistant';
    message.content = `ANSWER:${result.output.message.content}`;

    await Database.get<SearchMessageEntity>().save(message);
  }

  async #processSearchStep(sessionId: string) {
    const session = await this.#getSessionById(sessionId);

    const result = await this.llmService.chat([
      {
        role: 'system',
        content: SearchGetQueriesPrompt,
      },
      session.messages[0],
    ]);

    const message = new SearchMessageEntity();
    message.session = session;
    message.role = 'assistant';
    message.content = `QUERIES:${result.output.message.content}`;

    await Database.get<SearchMessageEntity>().save(message);

    const { queries, rerankingQuery } = JSON.parse(
      this.llmService.stripOutJson(result.output.message.content),
    );

    const results = (
      await Promise.all(
        queries.map((query) => this.searxngService.search(query)),
      )
    )
      .flat()
      .flatMap((res) => res.results.slice(0, 40));

    return { results, rerankingQuery };
  }

  #splitDocumentIntoChunks(
    document: string,
    chunkLength: number,
    overlap: number,
  ) {
    document = document
      .replaceAll('\n', '')
      .replaceAll('\t', '')
      .replaceAll('\r', '')
      .replace(/  +/g, ' ');

    const chunks: string[] = [];

    for (let i = 0; i < document.length; i += chunkLength - overlap) {
      const chunk = document.slice(i, i + chunkLength);
      if (chunk.length > 0) chunks.push(chunk);
    }

    return chunks;
  }

  async #interpretSearchResults(
    query: string,
    results: {
      url: string;
    }[],
  ) {
    const parsed = await Promise.all(
      [...new Set(results.map((r) => r.url))].map((url) =>
        this.#parseSearchResult({ url }),
      ),
    );
    const chunks = parsed
      .flat()
      .filter((a) => a != null)
      .flatMap((c) => c.content.map((text) => ({ url: c.url, content: text })));

    this.logger.log(`Found ${chunks.length} chunks for search query: ${query}`);

    const rerankResult = await this.llmService.rerank(
      query,
      chunks.map((c) => c.content),
    );
    const reranked: { url: string; content: string }[] = [];
    const seenUrls = new Set<string>();

    console.log(rerankResult);

    for (const res of rerankResult) {
      const chunk = chunks[res.index];
      /*if (seenUrls.has(chunk.url)) continue;
      seenUrls.add(chunk.url);*/

      reranked.push({
        url: chunk.url,
        content: chunk.content,
      });
    }

    this.logger.log(
      `Found ${reranked.length} unique relevant chunks for search query: ${query}`,
    );

    const topN = 10;
    const relevant = reranked.slice(0, topN);

    console.log(reranked[0]);
    console.log(reranked[reranked.length - 1]);

    return relevant;
  }

  async #parseSearchResult(result: { url: string }) {
    return await Promise.race<{
      url: string;
      content: string[];
    } | null>([
      this.#tryParseSearchResult(result),
      new Promise((resolve) =>
        setTimeout(() => {
          resolve(null);
        }, 5_000),
      ),
    ]);
  }

  async #tryParseSearchResult(result: { url: string }) {
    const { data: html } = await axios
      .get(result.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 5000,
      })
      .catch(() => ({ data: null }));
    if (!html) return null;

    const dom = new JSDOM(html, {
      url: result.url,
    });
    let reader = new Readability(dom.window.document);
    let article = reader.parse();

    return {
      url: result.url,
      content: this.#splitDocumentIntoChunks(
        article?.textContent || '',
        500,
        50,
      ).slice(0, 1000),
    };
  }

  async #getUserById(userId: string) {
    if (!userId || typeof userId != 'string' || userId.trim().length <= 0)
      throw new BadRequestException('Invalid user id');

    const user = await Database.get<UserEntity>().findOne({
      where: {
        id: userId,
      },
    });
    if (!user)
      // should never occur (auth guard creates the entity)
      throw new UnauthorizedException(
        'Unauthorized, something is really messed up :3',
      );

    return user;
  }

  async getChannel(authInfo: AuthInfo, sessionId: string) {
    const session = await this.getSession(authInfo, sessionId);

    return new Observable<MessageEvent>((sub) => {
      if (!this.#channelSubscribers.has(session.id))
        this.#channelSubscribers.set(session.id, []);

      this.#channelSubscribers.get(session.id)?.push(sub);

      sub.add(() => {
        this.#channelSubscribers
          .get(session.id)
          ?.splice(
            this.#channelSubscribers.get(session.id)?.indexOf(sub) || 0,
            1,
          );
      });
    });
  }

  #notifySubscribers(sessionId: string, message: MessageEvent) {
    this.#channelSubscribers.get(sessionId)?.forEach((sub) => {
      sub.next(message);
    });
  }
}
