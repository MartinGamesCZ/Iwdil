import { jsonrepair } from "jsonrepair";

export function SafeJSONParse(str: string) {
  str = str.trim();

  try {
    if (str.endsWith(".")) str = str.substring(0, str.length - 1);
    if (!str.includes("}")) str = str + "}";

    const startBracket = str.indexOf("{");
    const endBracket = str.lastIndexOf("}");

    if (startBracket == -1 || endBracket == -1) return {};

    return JSON.parse(jsonrepair(str.substring(startBracket, endBracket + 1)));
  } catch (_) {
    return {};
  }
}
