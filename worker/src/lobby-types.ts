export interface Env {
  LOBBY_DO: DurableObjectNamespace
  ASSETS: Fetcher
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
  | { type: "GAME_STATE"; state: any }
  | { type: "SETUP_LUCKY_NUMBER"; playerId: number; luckyNumber: number }
  | { type: "SETUP_WIN_AMOUNT"; amount: number }
  | { type: "CLEAR_LOBBY" }

export type LobbyServerMessage =
  | { type: "WELCOME"; playerId: number; players: LobbyPlayer[] }
  | { type: "JOINED"; player: LobbyPlayer }
  | { type: "LEFT"; playerId: number }
  | { type: "LOBBY_STATE"; lobby: LobbyState }
  | { type: "GAME_STARTING"; players: LobbyPlayer[] }
  | { type: "GAME_STATE"; state: any }
  | { type: "SETUP_LUCKY_NUMBER"; playerId: number; luckyNumber: number }
  | { type: "SETUP_WIN_AMOUNT"; amount: number }
  | { type: "ERROR"; code: string; message: string }
  | { type: "LOBBY_CLEARED" }
