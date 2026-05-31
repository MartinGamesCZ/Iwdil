"use client";

import { API, IResponse } from "@/classes/API";
import { AppShell } from "@/components/AppShell";
import { ErrorScreen } from "@/components/screens/ErrorScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { useAuthentication } from "@/context/AuthenticationContext";
import { cn } from "@/lib/utils";
import { ISearchDocumentEntity } from "@/types/entities/SearchDocumentEntity";
import {
  ESearchSessionState,
  ISearchSessionEntity,
} from "@/types/entities/SearchSessionEntity";
import { SafeJSONParse } from "@/utils/json";
import {
  CaretDownIcon,
  CaretLeftIcon,
  ChatIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import remarkGFM from "remark-gfm";

export interface IClientProps {
  sessionId: string;
}

export interface IQueriesProps {
  queries: string[];
}

export interface IAnswerProps {
  content: string;
}

export interface ISourceDocumentsProps {
  documents: ISearchDocumentEntity[];
}

export function Client(props: IClientProps) {
  const authManager = useAuthentication();

  const { isLoading, data, mutate } = useSWR(
    "search.session." + props.sessionId,
    () =>
      API.rbacGet<ISearchSessionEntity>(
        authManager,
        `/search/${props.sessionId}`,
      ),
  );

  useEffect(() => {
    const es = API.rbacSse(authManager, `/search/${props.sessionId}/channel`);

    es.addEventListener("progress", (event) => {
      mutate(JSON.parse(event.data) as IResponse<ISearchSessionEntity>);
    });
  }, [mutate, authManager, props.sessionId]);

  if (isLoading || !data) return <LoadingScreen />;
  if ("error" in data)
    return (
      <ErrorScreen
        message={`${data.error}: ${data.message}`}
        component={"search.session.[sessionId]"}
      />
    );

  return (
    <AppShell>
      <div className="p-16">
        <Link
          href="/search"
          className="flex items-center gap-2 mb-4 text-amber-500 hover:underline"
        >
          <CaretLeftIcon className="size-5" />
          Go back
        </Link>
        <h1 className="font-pf text-4xl leading-loose text-amber-500">
          {data.messages[0].content}
        </h1>
        <div>
          {data.messages
            .filter((message) => message.role != "user")
            .map((message, id) => {
              if (message.content.startsWith("QUERIES:"))
                return (
                  <Queries
                    key={id}
                    queries={SafeJSONParse(message.content).queries}
                  />
                );

              if (message.content.startsWith("ANSWER:")) {
                const parsed = SafeJSONParse(message.content);
                const content = parsed.answer || message.content.substring(7);
                return <Answer key={id} content={content} />;
              }

              return <Fragment key={id}></Fragment>;
            })}
        </div>
        {data.documents.length > 0 && (
          <SourceDocuments documents={data.documents} />
        )}
        {data.state != ESearchSessionState.Completed && (
          <p className="mt-4 text-muted-foreground text-center">
            {
              {
                [ESearchSessionState.Queued]: "Waiting in queue...",
                [ESearchSessionState.Processing]: "Processing...",
                [ESearchSessionState.Failed]: "Search failed.",
              }[data.state]
            }
          </p>
        )}
      </div>
    </AppShell>
  );
}

function Queries(props: IQueriesProps) {
  return (
    <div className="my-8 flex flex-col gap-2">
      {props.queries.map((query, index) => (
        <p
          key={"q" + index}
          className="text-amber-600/70 flex items-center gap-4"
        >
          <MagnifyingGlassIcon className="size-5" />
          {query}
        </p>
      ))}
    </div>
  );
}

function Answer(props: IAnswerProps) {
  console.log(props.content);

  return (
    <article className="text-amber-100 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGFM]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold font-pf text-amber-500 mt-8 mb-4 border-b border-amber-600/20 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold font-pf text-amber-500 mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium text-amber-500 mt-5 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-amber-500 mt-4 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-amber-100/90 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-2 text-amber-100/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-2 text-amber-100/90">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-amber-500 hover:underline hover:text-amber-400 transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded font-mono text-sm border border-amber-800/30">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-amber-950/60 border border-amber-800/40 rounded-lg p-4 my-4 overflow-x-auto font-mono text-sm text-amber-200">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-600/50 pl-4 py-1 my-4 italic text-amber-200/80 bg-amber-950/20 rounded-r">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 border border-amber-800/20 rounded-lg">
              <table className="min-w-full border-collapse text-sm text-amber-100">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-amber-950/50 border-b border-amber-800/40">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-amber-900/20">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-amber-950/10 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-amber-500">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-amber-100/80">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-t border-amber-600/20" />,
          strong: ({ children }) => (
            <strong className="font-bold text-amber-400">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-amber-200">{children}</em>
          ),
        }}
      >
        {props.content}
      </ReactMarkdown>
    </article>
  );
}

function SourceDocuments(props: ISourceDocumentsProps) {
  const [expanded, setExpanded] = useState(false);

  // Get unique URLs to display unique favicons in the header
  const uniqueUrls = Array.from(new Set(props.documents.map((doc) => doc.url)));

  // Group documents by URL
  const groupedDocuments = props.documents.reduce(
    (acc, doc) => {
      if (!acc[doc.url]) {
        acc[doc.url] = [];
      }
      acc[doc.url].push(doc.chunk);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const getHost = (url: string) => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  };

  return (
    <div className="my-4 p-2">
      <div
        className="flex flex-row items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {uniqueUrls.map((url, i) => {
          const host = getHost(url);
          return (
            <Image
              key={i}
              alt={host}
              src={`https://favicon.vemetric.com/${host}?size=64`}
              width={64}
              height={64}
              unoptimized
              className="size-4 inline-block align-middle"
            />
          );
        })}
        <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-2" />
        <CaretDownIcon
          className={`size-4 ${expanded ? "" : "-rotate-90"} transition-transform duration-300 ease-in-out`}
        />
      </div>
      <div
        className={cn([
          !expanded ? "h-0 overflow-hidden" : "h-auto",
          "transition-all duration-300 ease-in-out pt-4 flex flex-col gap-4",
        ])}
      >
        {Object.entries(groupedDocuments).map(([url, chunks], i) => {
          const host = getHost(url);
          return (
            <div key={i} className="flex flex-col gap-2">
              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-row gap-2 items-center text-amber-500 hover:underline"
              >
                <Image
                  alt={host}
                  src={`https://favicon.vemetric.com/${host}?size=64`}
                  width={64}
                  height={64}
                  unoptimized
                  className="size-4"
                />
                <span className="font-semibold text-sm truncate max-w-lg">
                  {url}
                </span>
              </Link>
              <div className="flex flex-col gap-2 ml-6">
                {chunks.map((chunk, ci) => (
                  <blockquote
                    key={ci}
                    className="pl-4 text-amber-500/70 border-l-2 border-amber-600/50 italic text-sm"
                  >
                    ... {chunk} ...
                  </blockquote>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
