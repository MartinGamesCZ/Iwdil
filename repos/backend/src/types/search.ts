export enum ESearchRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
}

export enum ESearchSessionState {
  Queued = 'queued',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}
