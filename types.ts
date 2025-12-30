export interface RoomConfig {
  code: string;
  username: string;
  isHost: boolean;
}

export interface User {
  id: string;
  name: string;
  isSelf: boolean;
  isAi?: boolean;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface BannerMessage {
  text: string;
  id: string;
}