import axios from "axios";
import { API } from "../classes/API";
import { exec } from "child_process";
import { APP_URL } from "../config";

export class QuickCreateCommand {
  static async run() {
    const image = await this.readImageFromStdin();

    if (!image) {
      console.error("Error: No image data provided on stdin.");
      return;
    }

    // Convert base64 data to binary buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 10 * 1024 * 1024) {
      console.error("Error: Image size exceeds 10MB limit.");
      return;
    }

    // Call backend to get presigned upload URL
    const response = await API.rbacPost<any, { url: string }>(
      "/reminders/quick-create/snippet/upload",
      {
        size: buffer.length,
      },
    );

    if ("error" in response) {
      console.error("Error: Failed to obtain presigned upload URL.", response);
      return;
    }

    const { url } = response;

    await axios.put(url, buffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });

    exec(`xdg-open ${APP_URL}/reminder/qc`);
  }

  static async readImageFromStdin() {
    return await Bun.stdin.text().then((text) => text.trim());
  }
}
