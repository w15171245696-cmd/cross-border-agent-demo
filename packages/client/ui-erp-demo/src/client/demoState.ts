/** Browser-local ERP demo login; not production authentication. */
const AUTH_KEY = 'dsh-erp-demo.login.v1'

function loadDemoLogin(): string | null {
  try { return localStorage.getItem(AUTH_KEY) === 'admin' ? 'admin' : null } catch { return null }
}

function setDemoLogin(username: string | null): void {
  try {
    if (username !== null) localStorage.setItem(AUTH_KEY, username)
    else localStorage.removeItem(AUTH_KEY)
  } catch { /* An unavailable storage backend keeps the current in-memory session. */ }
}

/** Browser-local login state shared by the ERP gate and sign-out control. */
export interface DemoAuthState {
  subscribe(listener: () => void): () => void
  getSnapshot(): boolean
  getUsernameSnapshot(): string | null
  signIn(username: string, password: string): boolean
  signOut(): void
}

/**
 * Create one login state shared by the full-page gate and ERP logout button.
 * @returns The observable browser-local login state.
 */
export function createDemoAuthState(): DemoAuthState {
  let currentUsername = loadDemoLogin()
  const listeners = new Set<() => void>()
  const update = (username: string | null): void => {
    if (currentUsername === username) return
    currentUsername = username
    setDemoLogin(username)
    listeners.forEach(listener => listener())
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot() { return currentUsername !== null },
    getUsernameSnapshot() { return currentUsername },
    signIn(username, password) {
      const normalizedUsername = username.trim()
      if (normalizedUsername !== 'admin' || password !== '123456') return false
      update(normalizedUsername)
      return true
    },
    signOut() { update(null) },
  }
}
