"use client";

import { AppShell } from "@/components/AppShell";
import { useAuthentication } from "@/context/AuthenticationContext";

export default function Page() {
  const auth = useAuthentication();

  return (
    <AppShell>
      <p>Hello {auth.claims.name}</p>
    </AppShell>
  );
}
