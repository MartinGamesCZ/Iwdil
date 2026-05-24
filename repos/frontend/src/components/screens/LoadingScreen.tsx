"use client";

import { Spinner } from "../ui/spinner";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <Spinner className="size-8" />
    </div>
  );
}
