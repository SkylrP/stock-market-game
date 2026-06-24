import { generateCode } from "./lobby"
import type { Env } from "./lobby-types"
export { LobbyDO } from "./lobby-do"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === "/api/create" && request.method === "POST") {
      const code = generateCode()
      const id = env.LOBBY_DO.idFromName(code)
      const stub = env.LOBBY_DO.get(id)
      await stub.fetch("https://dummy/reset")
      return new Response(JSON.stringify({ code }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    if (path === "/api/join" && request.method === "POST") {
      const clone = request.clone()
      const body = await clone.json() as { code?: string }
      const code = body?.code
      if (!code || !/^\d{4}$/.test(code)) {
        return new Response(JSON.stringify({ error: "Invalid code" }), { status: 400 })
      }
      const id = env.LOBBY_DO.idFromName(code)
      const stub = env.LOBBY_DO.get(id)
      return stub.fetch(request)
    }

    if (path === "/api/reset" && request.method === "POST") {
      const clone = request.clone()
      const body = await clone.json() as { code?: string }
      const code = body?.code
      if (!code || !/^\d{4}$/.test(code)) {
        return new Response(JSON.stringify({ error: "Invalid code" }), { status: 400 })
      }
      const id = env.LOBBY_DO.idFromName(code)
      const stub = env.LOBBY_DO.get(id)
      await stub.fetch("https://dummy/reset")
      return new Response(JSON.stringify({ ok: true }))
    }

    if (path === "/ws") {
      const code = url.searchParams.get("code")
      if (!code || !/^\d{4}$/.test(code)) {
        return new Response("Invalid code", { status: 400 })
      }
      const id = env.LOBBY_DO.idFromName(code)
      const stub = env.LOBBY_DO.get(id)
      return stub.fetch(request)
    }

    return env.ASSETS.fetch(request)
  },
}
