export class QuickCreateCommand {
  static async run() {
    const image = await this.readImageFromStdin();
  }

  static async readImageFromStdin() {
    return await Bun.stdin.text().then((text) => text.trim());
  }
}
