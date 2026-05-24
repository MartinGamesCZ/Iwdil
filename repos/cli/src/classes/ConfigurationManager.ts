import { exists, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export class ConfigurationManager {
  static #filePath = path.join(process.env.HOME!, ".config/iwdil/config.json");

  static async #ensureInitialized() {
    const parentDir = path.dirname(this.#filePath);

    if (await exists(this.#filePath)) return;

    if (!(await exists(parentDir)))
      await mkdir(parentDir, {
        recursive: true,
      });

    await writeFile(this.#filePath, JSON.stringify({}, null, 2));
  }

  static async #read(): Promise<
    Record<string, string | number | boolean | null>
  > {
    await this.#ensureInitialized();

    const data = await readFile(this.#filePath, "utf-8");
    return JSON.parse(data);
  }

  static async #write(data: Record<string, string | number | boolean | null>) {
    await this.#ensureInitialized();

    await writeFile(this.#filePath, JSON.stringify(data, null, 2));
  }

  static async get(key: string): Promise<string | number | boolean | null> {
    const data = await this.#read();

    return data[key] ?? null;
  }

  static async set(
    key: string,
    value: string | number | boolean | null,
  ): Promise<void> {
    const actual = await this.#read();

    actual[key] = value;
    await this.#write(actual);
  }
}
