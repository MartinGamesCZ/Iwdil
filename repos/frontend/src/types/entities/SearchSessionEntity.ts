import { ICUDEntityFields } from "./common";
import { ISearchDocumentEntity } from "./SearchDocumentEntity";
import { ISearchMessageEntity } from "./SearchMessageEntity";
import { IUserEntity } from "./UserEntity";

export enum ESearchSessionState {
  Queued = "queued",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

export type ISearchSessionEntity = ICUDEntityFields & {
  id: string;
  user: IUserEntity;
  messages: ISearchMessageEntity[];
  state: ESearchSessionState;
  documents: ISearchDocumentEntity[];
};
