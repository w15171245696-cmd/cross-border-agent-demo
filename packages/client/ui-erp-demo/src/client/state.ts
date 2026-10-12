/** Shared browser-only ERP navigation state for the main panel and native sidebar. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { loadMenus, type ErpMenu } from './model.ts'

/** Global tool destinations shown below ERP navigation. */
export type ToolId = 'database' | 'skills' | 'plugins'

const PAGE_KEY = 'dsh-erp-demo.page.v1'
const MAIN_VIEW_KEY = 'dsh-erp-demo.main-view.v1'
const DEFAULT_PAGE = { selectedId: 'overview', selectedTool: null } as const

/** Main panel restored after the browser reloads. */
export type MainView = 'erp' | 'conversation'

/**
 * Read the browser's last main panel choice.
 * @returns The stored choice, or ERP when storage is unavailable.
 */
export function loadMainView(): MainView {
  try { return localStorage.getItem(MAIN_VIEW_KEY) === 'conversation' ? 'conversation' : 'erp' }
  catch { return 'erp' }
}

/**
 * Save the selected main panel in browser storage when available.
 * @param view - Main panel to restore on the next load.
 */
export function saveMainView(view: MainView): void {
  try { localStorage.setItem(MAIN_VIEW_KEY, view) }
  catch { /* Panel navigation remains available when browser storage is unavailable. */ }
}

function loadPage(menus: readonly ErpMenu[]): Pick<ErpSnapshot, 'selectedId' | 'selectedTool'> {
  try {
    const raw = localStorage.getItem(PAGE_KEY)
    if (raw === null) return DEFAULT_PAGE
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return DEFAULT_PAGE
    const page = value as Record<string, unknown>
    const tool = page.selectedTool
    if (tool === 'database' || tool === 'skills' || tool === 'plugins') {
      return { selectedId: 'overview', selectedTool: tool }
    }
    const id = page.selectedId
    if (tool === null && typeof id === 'string'
      && (id === 'overview' || id === 'menu-config' || menus.some(menu => menu.id === id))) {
      return { selectedId: id, selectedTool: null }
    }
  } catch { /* Invalid or unavailable browser storage falls back to the workbench. */ }
  return DEFAULT_PAGE
}

function savePage(page: ErpSnapshot): void {
  try {
    localStorage.setItem(PAGE_KEY, JSON.stringify({
      selectedId: page.selectedId, selectedTool: page.selectedTool,
    }))
  } catch { /* Navigation remains available when browser storage is unavailable. */ }
}

/** Observable ERP navigation and menu state. */
export interface ErpSnapshot {
  menus: ErpMenu[]
  selectedId: string
  selectedTool: ToolId | null
}

/** Operations shared by the ERP panel and sidebar. */
export interface ErpState {
  subscribe(listener: () => void): () => void
  getSnapshot(): ErpSnapshot
  setMenus(menus: ErpMenu[]): void
  selectMenu(id: string): void
  selectTool(id: ToolId): void
}

/**
 * Create ERP navigation state from browser-local menu and page settings.
 * @returns The observable state shared by ERP views.
 */
export function createErpState(): ErpState {
  const menus = loadMenus()
  const store = createSnapshotStore<ErpSnapshot>({
    menus, ...loadPage(menus),
  })
  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    setMenus: menus => { store.update(draft => { draft.menus = menus }) },
    selectMenu: id => {
      store.update(draft => { draft.selectedId = id; draft.selectedTool = null })
      savePage(store.getSnapshot())
    },
    selectTool: id => {
      store.update(draft => { draft.selectedId = 'overview'; draft.selectedTool = id })
      savePage(store.getSnapshot())
    },
  }
}
