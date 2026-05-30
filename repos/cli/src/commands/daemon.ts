import { exec } from "child_process";
import { AuthenticationManager } from "../classes/AuthenticationManager";
import { EventSource } from "eventsource";
const { notify } = require("node-notifier");

export class DaemonCommand {
  static async run() {
    const token = await AuthenticationManager.obtainAccessToken();

    const es = new EventSource("http://localhost:3001/notifications/channel", {
      fetch: (input, init: any) =>
        fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        }),
    });

    es.addEventListener("qr:create", (msg: { data: string }) => {
      const data = JSON.parse(msg.data) as { text: string; when: string };

      notify({
        title: "Set reminder",
        message: `${data.text}\n- at ${data.when}`,
      });
    });

    es.addEventListener("qr:due", (msg: { data: string }) => {
      const data = JSON.parse(msg.data);

      notify({
        title: "Reminder due",
        message: data.inferedText,
      });
    });
  }
}
