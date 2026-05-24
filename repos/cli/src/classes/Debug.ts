import { DEBUG_ENABLED } from "../config";

export class Debug {
  static log(message: string) {
    if (DEBUG_ENABLED) console.log(`DEBUG: ${message}`)
  }
}
