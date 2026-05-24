import { exec } from "child_process";
import { AuthenticationManager } from "../classes/AuthenticationManager";

export class LoginCommand {
  static async run() {
    const { id, url, expiry_date } = await AuthenticationManager.startSignin();

    console.log(`Opening ${url} in browser, continue there.`);
    exec(`xdg-open ${url}`);

    await AuthenticationManager.finishSignin(id, expiry_date);

    console.log("Done.");
  }
}
