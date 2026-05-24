"use client";

import { API } from "@/classes/API";
import { AppShell } from "@/components/AppShell";
import { ErrorScreen } from "@/components/screens/ErrorScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/context/AuthenticationContext";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { toast } from "react-toastify";

export default function Page() {
  const authManager = useAuthentication();

  const { isLoading, data } = useSWR("reminders.qc.snippet.url", () =>
    API.rbacGet<{
      url: string | null;
    }>(authManager, "/reminders/quick-create/snippet/url"),
  );

  const { trigger, isMutating } = useSWRMutation(
    "reminders.qc.create",
    async (_, options: { arg: FormData }) => {
      const data = await API.rbacPost<
        {
          when: string;
        },
        {}
      >(authManager, "/reminders/quick-create/snippet/url", {
        when: options.arg.get("when") as string,
      });

      if ("error" in data) {
        toast.error(data.message);
        return;
      }

      return data;
    },
  );

  if (isLoading || !data) return <LoadingScreen />;
  if ("error" in data)
    return (
      <ErrorScreen
        message={`${data.error}: ${data.message}`}
        component={"reminders.qc.snippet.url"}
      />
    );

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 bg-background">
        <div className="w-full max-w-md p-6 bg-card border rounded-xl shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              trigger(new FormData(e.currentTarget));
            }}
          >
            <FieldSet className="gap-6">
              <legend className="text-lg font-semibold tracking-tight">
                Create reminder
              </legend>

              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel>When</FieldLabel>
                  <Input
                    placeholder="Eg. 10:20 wednesday or after my meeting"
                    required
                    name="when"
                  />
                </Field>

                {data.url ? (
                  <Field>
                    <FieldLabel>Snippet</FieldLabel>
                    <div className="overflow-hidden rounded-lg border bg-muted/20">
                      <img
                        src={data.url}
                        alt="Snippet"
                        className="w-full h-auto object-contain max-h-[300px]"
                      />
                    </div>
                  </Field>
                ) : (
                  <div className="text-xs text-muted-foreground italic py-2">
                    No screenshot snippet uploaded
                  </div>
                )}
              </FieldGroup>

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isMutating}
              >
                {isMutating ? "Creating..." : "Create Reminder"}
              </Button>
            </FieldSet>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
