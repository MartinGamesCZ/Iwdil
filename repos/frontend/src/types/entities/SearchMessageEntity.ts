import { ICUDEntityFields } from "./common";
import { ISearchSessionEntity } from "./SearchSessionEntity";

export type ISearchMessageEntity = ICUDEntityFields & {
  id: string;
  session: ISearchSessionEntity;
  role: "user" | "assistant" | "system";
  content: string;
};
