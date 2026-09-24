import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import type { Contract } from './contract'

export type Api = ContractRouterClient<Contract>

const TOKEN_KEY = 'pux.session'
export const session = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* private mode — session lasts for this tab only */
    }
  },
}

/** True for the static GitHub Pages build, where the same contract is implemented in the browser. */
export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === '1'

let client: Promise<Api> | null = null

export function api(): Promise<Api> {
  client ??= STATIC_DEMO
    ? import('./local').then((m) => m.createLocalClient(session.get) as unknown as Api)
    : Promise.resolve(
        createORPCClient<Api>(
          new RPCLink({
            url: () => new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/rpc`, window.location.origin).toString(),
            headers: (): Record<string, string> => {
              const t = session.get()
              return t ? { authorization: `Bearer ${t}` } : {}
            },
          }),
        ),
      )
  return client
}
