"use client";

import { API } from "@/classes/API";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/context/AuthenticationContext";

export default function Page() {
  const auth = useAuthentication();

  return (
    <AppShell>
      <p>Hello {auth.claims.name}</p>
      <Button
        onClick={async () => {
          console.log(await API.rbacGet(auth, "/protected"));
        }}
      >
        Test api
      </Button>
    </AppShell>
  );
}
