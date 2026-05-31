import { ICUDEntityFields } from "./common";

export type ISearchDocumentEntity = ICUDEntityFields & {
  id: string;
  url: string;
  chunk: string;
};
