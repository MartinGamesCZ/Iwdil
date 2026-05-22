"use client";

import { WarningIcon } from "@phosphor-icons/react";

interface IErrorScreenProps {
  component: string;
  message: string;
}

export function ErrorScreen(props: IErrorScreenProps) {
  return (
    <div className="w-screen h-screen fixed z-10000 bg-background flex flex-col items-center justify-center gap-1">
      <WarningIcon className="size-64 mb-8 text-yellow-500" />
      <h1 className="text-4xl font-bold">Application Error</h1>
      <p className="text-xl">{props.message}</p>
      <small className="text-sm text-muted-foreground">{`Component: ${props.component}`}</small>
    </div>
  );
}
