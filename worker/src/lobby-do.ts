import { DurableObject } from "cloudflare:workers"
import type { LobbyPlayer, LobbyClientMessage, LobbyServerMessage, Env } from "./lobby-types"

export class LobbyDO extends DurableObject {
  private players: LobbyPlayer[] = []
  private connections: Map<WebSocket, number> = new Map()
  private resetting = false

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<LobbyPlayer[]>("players")
      if (stored) this.players = stored
    })
  }

  private getActive(): WebSocket[] {
    return Array.from(this.ctx.getWebSockets())
  }

  private async fullReset() {
    if (this.resetting) return
    this.resetting = true

    const sockets = this.getActive()
    this.connections = new Map()
    this.players = []

    for (const ws of sockets) {
      try { ws.close(1000, "Lobby reset") } catch { }
    }

    await this.ctx.storage.deleteAll()

    this.resetting = false
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/reset") {
      await this.fullReset()
      return new Response("OK")
    }

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      if (this.players.length > 0 && this.getActive().length === 0) {
        await this.fullReset()
      }

      const pair = new WebSocketPair()
      const server = pair[1]
      this.ctx.acceptWebSocket(server)
      this.connections.set(server, 0)
      return new Response(null, { status: 101, webSocket: pair[0] })
    }

    // Reject join requests for lobbies with no players and no connections
    if (this.players.length === 0 && this.getActive().length === 0) {
      return new Response(JSON.stringify({ error: "Lobby not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ players: this.players }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    // Re-register connection if DO hibernated (in-memory connections Map was lost)
    if (!this.connections.has(ws)) {
      const idx = this.getActive().indexOf(ws)
      this.connections.set(ws, idx >= 0 && idx < this.players.length ? this.players[idx].id : 0)
    }

    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw)
    let msg: LobbyClientMessage
    try { msg = JSON.parse(text) } catch { return }

    if (msg.type === "JOIN") this.handleJoin(ws, msg.nickname)
    if (msg.type === "START_GAME") this.handleStartGame(ws)
    if (msg.type === "GAME_STATE") this.broadcastExcept(ws, { type: "GAME_STATE", state: msg.state })
    if (msg.type === "SETUP_LUCKY_NUMBER") {
      this.broadcastExcept(ws, { type: "SETUP_LUCKY_NUMBER", playerId: msg.playerId, luckyNumber: msg.luckyNumber })
    }
    if (msg.type === "SETUP_WIN_AMOUNT") this.broadcastExcept(ws, { type: "SETUP_WIN_AMOUNT", amount: msg.amount })
    if (msg.type === "CLEAR_LOBBY") {
      this.broadcast({ type: "LOBBY_CLEARED" })
      await this.fullReset()
    }
  }

  async webSocketClose(ws: WebSocket) {
    if (this.resetting) return

    const pid = this.connections.get(ws)
    if (pid) {
      this.players = this.players.filter(p => p.id !== pid)
      this.broadcast({ type: "LEFT", playerId: pid })
      await this.persist()
    }
    this.connections.delete(ws)

    // Last connection gone — wipe the lobby completely
    // Use getActive() instead of connections.size to handle hibernation
    if (this.getActive().length === 0) {
      this.players = []
      await this.ctx.storage.deleteAll()
    }
  }

  webSocketError(ws: WebSocket, error: unknown) {
    console.error("Lobby WS error:", error)
  }

  private async handleJoin(ws: WebSocket, nickname: string) {
    if (!nickname.trim()) {
      this.sendTo(ws, { type: "ERROR", code: "INVALID_NAME", message: "Nickname cannot be empty" })
      return
    }

    if (this.players.length > 0 && this.getActive().length === 0) {
      await this.fullReset()
    }

    // Clean up stale player entries created by DO hibernation losing the in-memory connections Map
    if (this.players.length > this.getActive().length) {
      this.players = []
      this.connections.clear()
      await this.ctx.storage.put("players", this.players)
    }

    if (this.players.length >= 8) {
      this.sendTo(ws, { type: "ERROR", code: "FULL", message: "Lobby is full" })
      return
    }

    const id = this.players.length + 1
    const player: LobbyPlayer = { id, nickname, connected: true }
    this.players.push(player)
    this.connections.set(ws, id)

    this.sendTo(ws, { type: "WELCOME", playerId: id, players: this.players })
    this.broadcastExcept(ws, { type: "JOINED", player })
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
    for (const ws of this.getActive()) {
      try { ws.send(data) } catch { }
    }
  }

  private broadcastExcept(wsSkip: WebSocket, msg: LobbyServerMessage) {
    const data = JSON.stringify(msg)
    for (const ws of this.getActive()) {
      if (ws !== wsSkip) {
        try { ws.send(data) } catch { }
      }
    }
  }

  private sendTo(ws: WebSocket, msg: LobbyServerMessage) {
    try { ws.send(JSON.stringify(msg)) } catch { }
  }

  private persist(): Promise<void> {
    return this.ctx.storage.put("players", this.players) as Promise<void>
  }
}
