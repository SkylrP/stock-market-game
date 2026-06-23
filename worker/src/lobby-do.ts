import { DurableObject } from "cloudflare:workers"
import type { LobbyPlayer, LobbyClientMessage, LobbyServerMessage, Env } from "./lobby-types"

export class LobbyDO extends DurableObject {
  private players: LobbyPlayer[] = []
  private connections: Map<WebSocket, number> = new Map()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<LobbyPlayer[]>("players")
      if (stored) this.players = stored
    })
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair()
      const server = pair[1]
      this.ctx.acceptWebSocket(server)
      this.connections.set(server, 0)
      return new Response(null, { status: 101, webSocket: pair[0] })
    }

    return new Response(JSON.stringify({ players: this.players }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw)
    let msg: LobbyClientMessage
    try { msg = JSON.parse(text) } catch { return }

    if (msg.type === "JOIN") this.handleJoin(ws, msg.nickname)
    if (msg.type === "START_GAME") this.handleStartGame(ws)
  }

  webSocketClose(ws: WebSocket) {
    const pid = this.connections.get(ws)
    if (pid) {
      this.players = this.players.filter(p => p.id !== pid)
      this.broadcast({ type: "LEFT", playerId: pid })
      this.persist()
    }
    this.connections.delete(ws)
  }

  webSocketError(ws: WebSocket, error: unknown) {
    console.error("Lobby WS error:", error)
  }

  private handleJoin(ws: WebSocket, nickname: string) {
    if (this.players.length >= 8) {
      this.sendTo(ws, { type: "ERROR", code: "FULL", message: "Lobby is full" })
      return
    }

    const id = this.players.length + 1
    const player: LobbyPlayer = { id, nickname, connected: true }
    this.players.push(player)
    this.connections.set(ws, id)

    this.sendTo(ws, { type: "WELCOME", playerId: id, players: this.players })
    this.broadcast({ type: "JOINED", player })
    this.persist()
  }

  private handleStartGame(ws: WebSocket) {
    const pid = this.connections.get(ws)
    if (pid !== 1) {
      this.sendTo(ws, { type: "ERROR", code: "NOT_HOST", message: "Only the host can start the game" })
      return
    }
    this.broadcast({ type: "GAME_STARTING", players: this.players })
  }

  private broadcast(msg: LobbyServerMessage) {
    const data = JSON.stringify(msg)
    for (const [ws] of this.connections) {
      try { ws.send(data) } catch { }
    }
  }

  private sendTo(ws: WebSocket, msg: LobbyServerMessage) {
    try { ws.send(JSON.stringify(msg)) } catch { }
  }

  private persist() {
    this.ctx.storage.put("players", this.players)
  }
}
