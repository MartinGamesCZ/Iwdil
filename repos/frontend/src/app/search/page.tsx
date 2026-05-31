"use client";

import { API } from "@/classes/API";
import { AppShell } from "@/components/AppShell";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthentication } from "@/context/AuthenticationContext";
import { ISearchSessionEntity } from "@/types/entities/SearchSessionEntity";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import useSWRMutation from "swr/mutation";

export default function Page() {
  const authManager = useAuthentication();
  const router = useRouter();

  const { trigger, isMutating } = useSWRMutation(
    "search.create",
    async (_, options: { arg: FormData }) => {
      const data = await API.rbacPost<
        {
          query: string;
        },
        ISearchSessionEntity
      >(authManager, "/search", {
        query: options.arg.get("query") as string,
      });

      if ("error" in data) {
        toast.error(data.message);
        return;
      }

      router.push(`/search/${data.id}`);

      return data;
    },
  );

  return (
    <AppShell>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isMutating) return;

          trigger(new FormData(e.target));
        }}
        className="w-screen h-screen flex flex-col items-center justify-center"
      >
        <Field className="max-w-1/4">
          <Input
            placeholder="What is ..."
            required
            name="query"
            className="scale-125"
            disabled={isMutating}
          />
        </Field>
      </form>
    </AppShell>
  );
}
