import { Client } from "./client";

interface IPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function Page(props: IPageProps) {
  const { sessionId } = await props.params;

  return <Client sessionId={sessionId} />;
}
