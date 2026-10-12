/** Register the ERP demo as one independent DSH Web panel. */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { SessionReference } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { ErpPage } from './ErpPage.tsx'
import { ErpBrandMark, ErpBrandName } from './ErpBrand.tsx'
import { ErpSidebar } from './ErpSidebar.tsx'
import { ErpChatConversation } from './ErpChatConversation.tsx'
import { ErpLoginPage } from './ErpLoginPage.tsx'
import { createDemoAuthState } from './demoState.ts'
import { createErpState, saveMainView } from './state.ts'
import { en, zh, type ErpLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Native DSH Conversation rendered inside the ERP floating window. */
    'erp.chat.conversation': { kind: 'single'; scope: 'session'; owner: Record<never, never> }
  }
  interface LocaleNamespaceMap {
    /** Copy for the local ERP demonstration. */
    erpDemo: ErpLocaleKey
  }
}

declare module '@deepseek-ai/dsh-api-session-controller/client' {
  interface SessionReferenceSourceMap {
    erpChatPopup: unknown
  }
}

const NS = 'erpDemo'
const PANEL_ID = 'erp-demo' as MainPanelId

/** Services required for the global panel, sidebar entry and localized copy. */
export const inject = ['slots', 'locale', 'layout', 'uiWorkspace', 'sessions', 'workspaces']

/**
 * Add the ERP demo panel and its DSH sidebar entry.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-erp-demo: dictionaries')
  if (process.env.DSH_CLIENT_BUILD_PROFILE !== 'official') {
    ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({
      name: 'sidebar.brand.mark',
    }, ErpBrandMark))
    ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({
      name: 'sidebar.brand.name', locale: NS,
    }, ErpBrandName))
  }
  const erp = createErpState()
  const auth = createDemoAuthState()
  const authRequired = process.env.DSH_CLIENT_BUILD_PROFILE !== 'official'
  const showErpAfterLogin = (freshLogin: boolean): void => {
    if (freshLogin) erp.selectMenu('overview')
    ctx.layout.selectPanel(PANEL_ID)
    saveMainView('erp')
    if (document.querySelector('[data-sidebar-collapsed]') !== null) ctx.layout.toggleSidebar()
  }
  if (authRequired) ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'erp-demo-login', locale: NS,
    inject: () => ({ auth, showErp: showErpAfterLogin, erpPanelId: PANEL_ID }),
  }, ErpLoginPage))
  const uiWorkspace = ctx.get('uiWorkspace') as UiWorkspace
  const acquireChat = async (): Promise<SessionReference | undefined> => {
    const workspaces = ctx.workspaces.list.getSnapshot().items
    const sessions = ctx.sessions.list.getSnapshot().byId
    const currentSessionId = Object.values(sessions).find(summary =>
      (summary.retainedBy.mainView ?? 0) > 0)?.id
    const currentWorkspace = workspaces.find(workspace =>
      currentSessionId !== undefined && workspace.sessionIds.includes(currentSessionId))
    let recentWorkspace: typeof workspaces[number] | undefined
    let recentTime = Number.NEGATIVE_INFINITY
    for (const workspace of workspaces) {
      const latest = Math.max(Date.parse(workspace.createdAt),
        ...workspace.sessionIds.map(id => sessions[id]?.updatedAt ?? Number.NEGATIVE_INFINITY))
      if (recentWorkspace === undefined || latest > recentTime) {
        recentWorkspace = workspace
        recentTime = latest
      }
    }
    const target: WorkspaceId | undefined = currentWorkspace?.workspaceId ?? recentWorkspace?.workspaceId
    if (target === undefined) return undefined
    const sessionId = await uiWorkspace.connectWorkspace(target)
    return ctx.sessions.retain(sessionId, { source: 'erpChatPopup' })
  }
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: PANEL_ID, locale: NS,
    children: { 'erp.chat.conversation': { kind: 'single', scope: 'session' } },
    inject: () => ({ erp, auth, authRequired, acquireChat }),
  }, ErpPage))
  ctx.slots.inject('erp.chat.conversation', () => ctx.slots.register({
    name: 'erp.chat.conversation',
  }, ErpChatConversation))
  ctx.slots.inject('sidebar.erp-navigation', () => ctx.slots.register({
    name: 'sidebar.erp-navigation', locale: NS,
    inject: () => ({ erp, showErp: () => {
      ctx.layout.selectPanel(PANEL_ID)
      saveMainView('erp')
    } }),
  }, ErpSidebar))
}
