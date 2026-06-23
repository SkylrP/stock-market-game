import { generateCode } from "./lobby"
import type { Env } from "./lobby-types"

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === "/api/create" && request.method === "POST") {
      const code = generateCode()
      env.LOBBY_DO.idFromName(code)
      return new Response(JSON.stringify({ code }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    if (path === "/api/join" && request.method === "POST") {
      const body = await request.json() as { code?: string }
      const code = body?.code
      if (!code || !/^\d{4}$/.test(code)) {
        return new Response(JSON.stringify({ error: "Invalid code" }), { status: 400 })
      }
      const id = env.LOBBY_DO.idFromName(code)
      const stub = env.LOBBY_DO.get(id)
      return stub.fetch(request)
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

    return new Response("Not found", { status: 404 })
  },
}
