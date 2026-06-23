export interface Env {
  LOBBY_DO: DurableObjectNamespace
}

export interface LobbyPlayer {
  id: number
  nickname: string
  connected: boolean
}

export interface LobbyState {
  phase: "LOBBY"
  players: LobbyPlayer[]
}

export type LobbyClientMessage =
  | { type: "JOIN"; nickname: string }
  | { type: "START_GAME" }

export type LobbyServerMessage =
  | { type: "WELCOME"; playerId: number; players: LobbyPlayer[] }
  | { type: "JOINED"; player: LobbyPlayer }
  | { type: "LEFT"; playerId: number }
  | { type: "LOBBY_STATE"; lobby: LobbyState }
  | { type: "GAME_STARTING"; players: LobbyPlayer[] }
  | { type: "ERROR"; code: string; message: string }
