/** ERP demo panel: navigation, sample records, and browser-local menu editing. */
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import type { PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionReference } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import {
  DEFAULT_MENUS, MODULE_TABLES, descendantIds, menuChain, menuChildren, menuDepth, saveMenus,
  type ErpMenu,
} from './model.ts'
import type { ErpLocaleKey } from './locales.ts'
import type { DemoAuthState } from './demoState.ts'
import type { ErpState, ToolId } from './state.ts'
import css from './ErpPage.module.css'

type PageProps = PropsRuntime<'main'> & PropsRenderSlots<'erp.chat.conversation'> & PropsLocale<'erpDemo'> & {
  erp: ErpState
  auth: DemoAuthState
  authRequired: boolean
  acquireChat: () => Promise<SessionReference | undefined>
}
type IconKind = 'sales' | 'products' | 'warehouse' | 'procurement' | 'inventory' | 'wms' | 'admin' | 'settings' | 'grid'

interface MenuDraft {
  id: string | null
  parentId: string | null
  title: string
  path: string
  icon: string
  order: string
  hidden: boolean
}

const iconOptions: readonly IconKind[] = ['grid', 'sales', 'products', 'warehouse', 'procurement', 'inventory', 'wms', 'admin', 'settings']
const iconKeys: Record<IconKind, ErpLocaleKey> = {
  grid: 'iconGrid', sales: 'iconSales', products: 'iconProducts', warehouse: 'iconWarehouse',
  procurement: 'iconProcurement', inventory: 'iconInventory', wms: 'iconWms', admin: 'iconAdmin', settings: 'iconSettings',
}

/** Small line icons keep the demo independent of additional UI libraries. */
export function Glyph({ kind, size = 18 }: { kind: string; size?: number }): ReactNode {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  switch (kind) {
    case 'dashboard': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M3 9h18M10 9v12M13 17l2-3 2 1 2-3" /></svg>
    case 'sales': return <svg {...common}><path d="M3 5h2l2 11h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>
    case 'products': return <svg {...common}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 7 9 5 9-5M3 7v10l9 5 9-5V7M12 12v10" /></svg>
    case 'warehouse': return <svg {...common}><path d="m2 10 10-7 10 7v11H2V10Z" /><path d="M7 21v-8h10v8M7 16h10" /></svg>
    case 'procurement': return <svg {...common}><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg>
    case 'inventory': return <svg {...common}><path d="M4 4h16v5H4zM4 10h16v5H4zM4 16h16v5H4zM8 6.5h3M8 12.5h3M8 18.5h3" /></svg>
    case 'wms': return <svg {...common}><path d="M4 4v16h16M8 16l4-4 3 2 5-7" /><path d="M17 7h3v3" /></svg>
    case 'admin': return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M18 8a3 3 0 0 1 0 6M18 17a4 4 0 0 1 3 3" /></svg>
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></svg>
    case 'database': return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
    case 'skills': return <svg {...common}><path d="M9 3h6l1 3 3 1 2 4-3 2v3l-4 2-2-3-3 1-3 3-3-3 2-4-2-3 4-2 2-4Z" /><circle cx="12" cy="10" r="2" /></svg>
    case 'plugins': return <svg {...common}><path d="M8 3v5m8-5v5M5 8h14v5a7 7 0 0 1-7 7v2M9 22h6" /></svg>
    case 'folder': return <svg {...common}><path d="M3 6h7l2 2h9v11H3z" /></svg>
    case 'search': return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
    case 'panel': return <svg {...common}><rect x="2" y="3" width="20" height="18" rx="3" /><path d="M9 3v18" /></svg>
    case 'chat': return <svg {...common}><path d="M20 11a8 8 0 0 1-8 8c-1.2 0-2.4-.3-3.5-.8L4 20l1.8-4.5A8 8 0 1 1 20 11Z" /></svg>
    case 'sparkles': return <svg {...common}><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" /></svg>
    case 'logout': return <svg {...common}><path d="M10 3H4v18h6M14 7l5 5-5 5M8 12h11" /></svg>
    default: return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  }
}

/** Shared brand mark for the DSH entry and ERP navigation. */
export function BrandLogo({ size }: { size: number }): ReactNode {
  const gradientId = useId()
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <defs><linearGradient id={gradientId} x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse"><stop stopColor="#2563EB" /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
    <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
    <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="1.7" opacity=".74" />
    <path d="M8.5 20h23" stroke="white" strokeWidth="1.5" opacity=".42" />
    <path d="m12.6 25.5 5.7-6 3.5 2.6 6-6.3m-4.2.2H28v4.3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

/** Icon for the global DSH sidebar entry. */
export function ErpPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>): ReactNode {
  return <BrandLogo size={size} />
}

function newDraft(menus: readonly ErpMenu[], parentId: string | null): MenuDraft {
  const siblings = menuChildren(menus, parentId, true)
  const parent = parentId === null ? undefined : menus.find(menu => menu.id === parentId)
  const suffix = Math.random().toString(36).slice(2, 8)
  return {
    id: null, parentId, title: '', path: `${parent?.path ?? ''}/custom-${suffix}`,
    icon: 'grid', order: String(Math.max(0, ...siblings.map(menu => menu.order)) + 10), hidden: false,
  }
}

function IconButton({ title, onClick, children, danger = false }: {
  title: string; onClick: () => void; children: ReactNode; danger?: boolean
}): ReactNode {
  return <button type="button" className={danger ? css.dangerAction : css.textAction} onClick={onClick} title={title}>{children}</button>
}


const workbenchTodos = [
  { id: 'listing-active', titleKey: 'todoActiveListing', meta: ['BOH71WXYQL', 'YY_CA'] },
  { id: 'listing-cart', titleKey: 'todoCartListing', meta: ['BOH71WXYQL', 'YY_CA'] },
  { id: 'listing-seller', titleKey: 'todoSellerListing', meta: ['BOH71WXYQL', 'YY_CA'] },
  { id: 'store-feedback', titleKey: 'todoStoreFeedback', meta: ['YY_CA', '加拿大'] },
  { id: 'listing-category', titleKey: 'todoCategoryListing', meta: ['佣金：+ 0.3'] },
  { id: 'visual-image', titleKey: 'todoVisualImage', meta: ['44063-Y06N0001-A02'] },
] as const satisfies readonly { id: string; titleKey: ErpLocaleKey; meta: readonly string[] }[]

type WorkbenchTodoId = (typeof workbenchTodos)[number]['id']

const todoResultOptions = {
  'listing-active': ['resultRestoredListing', 'resultInventoryHandled', 'resultOther'],
  'listing-cart': ['resultCartRestored', 'resultOtherAlt'],
  'listing-seller': ['resultSellerGone', 'resultOtherAlt'],
  'store-feedback': ['resultCannotDelete', 'resultDeleted', 'resultOther'],
  'listing-category': ['resultCannotChangeCategory', 'resultCategoryRestored', 'resultOther'],
  'visual-image': ['resultImageHandled', 'resultOther'],
} satisfies Record<WorkbenchTodoId, readonly ErpLocaleKey[]>

type TodoDialog = { kind: 'start' | 'finish'; taskId: WorkbenchTodoId }

const subordinateTasks = Array.from({ length: 7 }, (_, index) => index)

const workbenchNotifications = [
  'notificationAccount', 'notificationSaleDate', 'notificationReview',
  'notificationArrival', 'notificationStockout', 'notificationCapacity',
] as const satisfies readonly ErpLocaleKey[]

type WorkbenchNotificationKey = (typeof workbenchNotifications)[number]

const notificationSampleReferences = {
  saleSku: '44063-Y06N0001-A02',
  reviewAsin: 'B0H2Q6RV4V',
  reviewSku: '33635-Y02R0004-X001DKFOLZ',
  arrivalAsin: 'B0C284TCW2',
}

const accountWarningMetrics: readonly { labelKey: ErpLocaleKey; value: string; alert?: boolean }[] = [
  { labelKey: 'notificationIpInfringement', value: '1', alert: true },
  { labelKey: 'notificationIpComplaint', value: '0' },
  { labelKey: 'notificationAuthenticityComplaint', value: '0' },
  { labelKey: 'notificationConditionComplaint', value: '0' },
  { labelKey: 'notificationListingPolicy', value: '0' },
  { labelKey: 'notificationRestrictedPolicy', value: '0' },
  { labelKey: 'notificationReviewPolicy', value: '0' },
  { labelKey: 'notificationProductSafety', value: '0' },
  { labelKey: 'notificationOtherPolicy', value: '0' },
  { labelKey: 'notificationPolicyWarning', value: '0' },
  { labelKey: 'notificationOrderDefectRate', value: '0.00%' },
  { labelKey: 'notificationInvoiceDefectRate', value: '0.00%' },
]

/** Read-only details for the six sample Workbench notifications. */
function NotificationDetail({ t, notification, createdAt, onClose }: {
  t: PageProps['t']; notification: WorkbenchNotificationKey; createdAt: string; onClose: () => void
}): ReactNode {
  const title = t(notification === 'notificationAccount' ? 'notificationAccountDetailTitle' : notification)
  return <div className={css.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className={css.notificationDialog} role="dialog" aria-modal="true" aria-labelledby="erp-notification-dialog-title" onKeyDown={event => { if (event.key === 'Escape') onClose() }}>
      <header className={css.notificationDialogHeader}><span>{t('notificationDetail')}</span><button type="button" autoFocus aria-label={t('closeNotification')} onClick={onClose}>×</button></header>
      <div className={css.notificationDialogBody}>
        <h2 id="erp-notification-dialog-title">{title}</h2>
        <div className={css.notificationDetailRow}><span>{t('notificationTime')}</span><time dateTime={createdAt.replace(' ', 'T')}>{createdAt}</time></div>
        <div className={css.notificationDetailRow}><span>{t('notificationContent')}</span><div className={css.notificationDetailContent}>
          {notification === 'notificationAccount' ? <>
            <p>{t('notificationAccountIntro')}</p>
            <dl className={css.notificationMetrics}>{accountWarningMetrics.map(metric => <div key={metric.labelKey}><dt>{t(metric.labelKey)}</dt><dd data-alert={metric.alert || undefined}>{metric.value}</dd></div>)}</dl>
          </> : notification === 'notificationSaleDate' ? <>
            <div className={css.notificationDetailFact}><span>{t('notificationSystemSku')}</span><strong>{notificationSampleReferences.saleSku}</strong></div>
            <p>{t('notificationSaleDateMessage')}</p>
          </> : notification === 'notificationReview' ? <>
            <dl className={css.notificationFacts}>
              <div><dt>{t('notificationProductName')}</dt><dd>{t('notificationReviewProduct')}</dd></div>
              <div><dt>{t('notificationAsin')}</dt><dd>{notificationSampleReferences.reviewAsin}</dd></div>
              <div><dt>{t('notificationSystemSku')}</dt><dd>{notificationSampleReferences.reviewSku}</dd></div>
              <div><dt>{t('notificationRating')}</dt><dd>{t('notificationOneStar')}</dd></div>
            </dl>
            <p className={css.notificationQuote}>{t('notificationReviewComment')}</p>
          </> : notification === 'notificationArrival' ? <>
            <div className={css.notificationDetailFact}><span>{t('notificationAsin')}</span><strong>{notificationSampleReferences.arrivalAsin}</strong></div>
            <p>{t('notificationArrivalMessage')}</p>
          </> : <p>{t(notification === 'notificationCapacity' ? 'notificationCapacityMessage' : 'notificationStockoutMessage')}</p>}
        </div></div>
      </div>
    </section>
  </div>
}

const weekdayKeys = [
  'weekdaySunday', 'weekdayMonday', 'weekdayTuesday', 'weekdayWednesday',
  'weekdayThursday', 'weekdayFriday', 'weekdaySaturday',
] as const

/** My-tasks interactions live only for this mounted workbench; a reload restores the sample. */
function WorkbenchTasks({ t, accountName }: Pick<PageProps, 't'> & { accountName: string }): ReactNode {
  const [actionHint, setActionHint] = useState('')
  const [openNotification, setOpenNotification] = useState<WorkbenchNotificationKey | null>(null)
  const [startedTaskIds, setStartedTaskIds] = useState<ReadonlySet<string>>(() => new Set())
  const [completedTaskIds, setCompletedTaskIds] = useState<ReadonlySet<string>>(() => new Set())
  const [todoDialog, setTodoDialog] = useState<TodoDialog | null>(null)
  const [selectedResults, setSelectedResults] = useState<readonly ErpLocaleKey[]>([])
  const [resultDescription, setResultDescription] = useState('')
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const nextMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const delay = Math.max(0, nextMidnight.getTime() - Date.now() + 1000)
    const timer = window.setTimeout(() => setToday(new Date()), delay)
    return () => window.clearTimeout(timer)
  }, [today])
  const year = String(today.getFullYear())
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const isoDate = [year, month, day].join('-')
  const displayDate = [year, month, day].join('/')
  const sampleCreatedAt = isoDate + ' 09:05:10'
  const visibleTodos = workbenchTodos.filter(item => !completedTaskIds.has(item.id))
  const dialogTask = workbenchTodos.find(item => item.id === todoDialog?.taskId)
  const closeTodoDialog = (): void => {
    setTodoDialog(null)
    setSelectedResults([])
    setResultDescription('')
  }
  const openTodoDialog = (taskId: WorkbenchTodoId, kind: TodoDialog['kind']): void => {
    setSelectedResults(kind === 'finish' ? todoResultOptions[taskId].slice(0, 1) : [])
    setResultDescription('')
    setTodoDialog({ taskId, kind })
  }
  const confirmTodoDialog = (): void => {
    if (todoDialog === null) return
    if (todoDialog.kind === 'start') {
      setStartedTaskIds(previous => new Set(previous).add(todoDialog.taskId))
    } else if (selectedResults.length > 0) {
      setCompletedTaskIds(previous => new Set(previous).add(todoDialog.taskId))
    } else return
    closeTodoDialog()
  }
  const dailyCards: readonly { icon: string; labelKey: ErpLocaleKey; detail: ErpLocaleKey }[] = [
    { icon: '★★★☆☆', labelKey: 'dailyFortune', detail: 'dailyFortuneText' },
    { icon: '💼', labelKey: 'dailyAdvice', detail: 'dailyAdviceText' },
    { icon: '☕', labelKey: 'dailyDrink', detail: 'dailyDrinkText' },
    { icon: '🐞', labelKey: 'dailyBoss', detail: 'dailyBossText' },
    { icon: '🎯', labelKey: 'dailyGoal', detail: 'dailyGoalText' },
  ]
  return <section className={css.workbenchTasks} aria-label={t('workbenchTasks')}>
    <div className={css.dailyStrip}>
      <div className={css.dailyGreeting}>
        <time className={css.dailyDate} dateTime={isoDate}><strong>{day}</strong><span>{t(weekdayKeys[today.getDay()] ?? 'weekdaySunday')}</span><small>{displayDate}</small></time>
        <div><h2>{t('dailyGreeting')}{accountName}</h2><p>{t('dailyQuote')}</p></div>
      </div>
      <div className={css.dailyCards}>{dailyCards.map(card => <article className={css.dailyCard} key={card.labelKey}><span className={css.dailyCardLabel}><span aria-hidden="true">{card.icon}</span> {t(card.labelKey)}</span><p>{t(card.detail)}</p></article>)}</div>
    </div>
    <div className={css.taskBoard}>
      <section className={[css.taskPanel, css.todoPanel].join(' ')} aria-labelledby="erp-todo-title">
        <header className={css.taskPanelHeader}><div className={css.taskPanelHeading}><span className={css.taskPanelIcon} aria-hidden="true">▣</span><h2 id="erp-todo-title">{t('myTodos')}</h2><span className={css.taskBadge}>{String(visibleTodos.length).padStart(2, '0')}</span></div></header>
        <div className={css.todoList} data-scrollable={visibleTodos.length > 10 || undefined}>
          {visibleTodos.map(item => <article className={css.todoItem} key={item.id}>
            <div className={css.todoCopy}><h3>{t(item.titleKey)}</h3><div className={css.todoMeta}>{item.meta.map(value => <span key={value}>{value}</span>)}<span>{t('createdAt')}：{sampleCreatedAt}</span></div></div>
            <button type="button" className={css.taskLink} onClick={() => openTodoDialog(item.id, startedTaskIds.has(item.id) ? 'finish' : 'start')}>{t(startedTaskIds.has(item.id) ? 'finishTask' : 'startTask')} <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 2 3 3-3 3" /></svg></button>
          </article>)}
        </div>
      </section>
      <section className={[css.taskPanel, css.notificationPanel].join(' ')} aria-labelledby="erp-notification-title">
        <header className={css.taskPanelHeader}><div className={css.taskPanelHeading}><span className={css.taskPanelIcon} aria-hidden="true">▦</span><h2 id="erp-notification-title">{t('unreadNotifications')}</h2><span className={css.taskBadge}>{String(workbenchNotifications.length).padStart(2, '0')}</span></div><button type="button" className={css.taskLink} onClick={() => setActionHint(t('noUnreadNotifications'))}>{t('markAllRead')}</button></header>
        <div className={css.notificationList} data-scrollable={workbenchNotifications.length > 10 || undefined}>
          {workbenchNotifications.map(title => <article className={css.notificationCard} key={title}><button type="button" className={css.notificationCardButton} onClick={() => setOpenNotification(title)}><span className={css.notificationCardTitle}>{t(title)}</span><span>{t('createdAt')}：{sampleCreatedAt}</span></button></article>)}
        </div>
      </section>
      <section className={[css.taskPanel, css.subordinatePanel].join(' ')} aria-labelledby="erp-subordinate-title">
        <header className={css.taskPanelHeader}><div className={css.taskPanelHeading}><span className={css.taskPanelIcon} aria-hidden="true">♟</span><h2 id="erp-subordinate-title">{t('subordinatePending')}</h2><span className={css.taskBadge}>{String(subordinateTasks.length).padStart(2, '0')}</span></div></header>
        <div className={css.subordinatePerson}><span className={css.personAvatar}>{t('subordinateAvatar')}</span><strong>{t('subordinateName')}</strong><span className={css.personCount}>{t('subordinateCount')}</span></div>
        <div className={css.subordinateList} data-scrollable={subordinateTasks.length > 10 || undefined}>
          {subordinateTasks.map(index => <div className={css.subordinateItem} key={index}><span>{t('subordinateTask')}</span><time dateTime={isoDate}>{displayDate}</time></div>)}
        </div>
      </section>
    </div>
    {actionHint !== '' && <p className={css.taskActionHint} role="status">{actionHint}</p>}
    {openNotification !== null && <NotificationDetail t={t} notification={openNotification} createdAt={sampleCreatedAt} onClose={() => setOpenNotification(null)} />}
    {todoDialog !== null && dialogTask !== undefined && <div className={css.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) closeTodoDialog() }}>
      <section className={css.todoDialog} role="dialog" aria-modal="true" aria-labelledby="erp-todo-dialog-title" onKeyDown={event => { if (event.key === 'Escape') closeTodoDialog() }}>
        <header className={css.todoDialogHead}><h2 id="erp-todo-dialog-title">{t(todoDialog.kind === 'start' ? 'confirmStartTask' : 'confirmFinishTask')}</h2></header>
        <div className={css.todoDialogBody}>
          {todoDialog.kind === 'start'
            ? <p className={css.todoStartPrompt}>{t('confirmStartTaskDescription')}<strong>{t(dialogTask.titleKey)}</strong></p>
            : <>
              <p className={css.todoResultPrompt}>{t('taskResultPrompt')}</p>
              <div className={css.todoResultList}>{todoResultOptions[dialogTask.id].map(resultKey => <label className={css.todoResultOption} key={resultKey}>
                <input type="checkbox" checked={selectedResults.includes(resultKey)} onChange={event => setSelectedResults(previous => event.target.checked ? [...previous, resultKey] : previous.filter(key => key !== resultKey))} />
                <span>{t(resultKey)}</span>
              </label>)}</div>
              <textarea className={css.todoDescription} aria-label={t('taskResultDescription')} placeholder={t('taskResultPlaceholder')} value={resultDescription} onChange={event => setResultDescription(event.target.value)} />
            </>}
        </div>
        <footer className={css.todoDialogActions}>
          <button type="button" className={css.secondaryButton} autoFocus onClick={closeTodoDialog}>{t('cancel')}</button>
          <button type="button" className={css.primaryButton} disabled={todoDialog.kind === 'finish' && selectedResults.length === 0} onClick={confirmTodoDialog}>{t(todoDialog.kind === 'start' ? 'confirmStart' : 'confirmFinish')}</button>
        </footer>
      </section>
    </div>}
  </section>
}

/** Complete ERP panel rendered into DSH's global main slot. */
export function ErpPage({ t, erp, auth, authRequired, acquireChat, SessionProvider, renderSlot }: PageProps): ReactNode {
  const loggedIn = useSyncExternalStore(auth.subscribe, auth.getSnapshot)
  const signedInName = useSyncExternalStore(auth.subscribe, auth.getUsernameSnapshot)
  const { menus, selectedId, selectedTool } = useSyncExternalStore(erp.subscribe, erp.getSnapshot)
  const [draft, setDraft] = useState<MenuDraft | null>(null)
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatReference, setChatReference] = useState<SessionReference | null>(null)
  const [chatStatus, setChatStatus] = useState<'loading' | 'no-workspace' | 'error'>('loading')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuId = useId()
  const profileId = useId()
  const accountName = signedInName ?? t('demoAccount')
  const chatReferenceRef = useRef<SessionReference | null>(null)
  const chatRequest = useRef(0)
  useEffect(() => () => {
    chatRequest.current += 1
    chatReferenceRef.current?.release()
    chatReferenceRef.current = null
  }, [])
  useEffect(() => {
    if (!accountMenuOpen) return
    const closeOnOutsideClick = (event: PointerEvent): void => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  const active = menus.find(menu => menu.id === selectedId)
  const chain = active === undefined ? [] : menuChain(menus, active.id)
  const root = chain[0]
  const table = root === undefined ? undefined : MODULE_TABLES[root.id]
  const toolItems: { id: ToolId; icon: string; label: string }[] = [
    { id: 'database', icon: 'database', label: t('database') },
    { id: 'skills', icon: 'skills', label: t('skills') },
    { id: 'plugins', icon: 'plugins', label: t('plugins') },
  ]
  const selectedToolItem = toolItems.find(item => item.id === selectedTool)
  function commit(next: ErpMenu[]): boolean {
    if (!saveMenus(next)) { setError(t('saveFailed')); return false }
    erp.setMenus(next)
    setError('')
    return true
  }

  function navigate(id: string): void {
    erp.selectMenu(id)
  }

  function closeChat(): void {
    chatRequest.current += 1
    chatReferenceRef.current?.release()
    chatReferenceRef.current = null
    setChatReference(null)
    setChatOpen(false)
  }

  function openChat(): void {
    if (chatOpen) return
    setChatOpen(true)
    setChatStatus('loading')
    const request = ++chatRequest.current
    void acquireChat().then(reference => {
      if (chatRequest.current !== request) {
        reference?.release()
        return
      }
      if (reference === undefined) {
        setChatStatus('no-workspace')
        return
      }
      chatReferenceRef.current = reference
      setChatReference(reference)
    }).catch(() => {
      if (chatRequest.current === request) setChatStatus('error')
    })
  }

  function signOut(): void {
    setAccountMenuOpen(false)
    setProfileOpen(false)
    closeChat()
    auth.signOut()
  }

  function openDraft(parentId: string | null, item?: ErpMenu): void {
    setError('')
    setDraft(item === undefined ? newDraft(menus, parentId) : {
      id: item.id, parentId: item.parentId, title: item.title, path: item.path,
      icon: item.icon, order: String(item.order), hidden: item.hidden,
    })
  }

  function saveDraft(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (draft === null) return
    const title = draft.title.trim()
    const path = draft.path.trim()
    if (title === '') { setError(t('nameRequired')); return }
    if (!path.startsWith('/') || path.length < 2 || path.includes(' ')) { setError(t('pathRequired')); return }
    if (menus.some(item => item.path === path && item.id !== draft.id)) { setError(t('pathDuplicate')); return }
    if (draft.parentId !== null) {
      const parent = menus.find(menu => menu.id === draft.parentId)
      if (parent === undefined || menuDepth(menus, parent.id) >= 3) { setError(t('parentInvalid')); return }
    }
    const item: ErpMenu = {
      id: draft.id ?? `custom-${crypto.randomUUID()}`, parentId: draft.parentId,
      title, path, icon: draft.icon, order: Number(draft.order) || 10, hidden: draft.hidden,
    }
    const next = draft.id === null ? [...menus, item] : menus.map(menu => menu.id === draft.id ? item : menu)
    if (commit(next)) {
      setDraft(null)
    }
  }

  function removeMenu(id: string): void {
    if (!window.confirm(t('removeConfirm'))) return
    const removed = descendantIds(menus, id)
    if (commit(menus.filter(menu => !removed.has(menu.id))) && removed.has(selectedId)) erp.selectMenu('overview')
  }

  function resetMenus(): void {
    if (!window.confirm(t('resetConfirm'))) return
    if (commit(DEFAULT_MENUS.map(menu => ({ ...menu })))) erp.selectMenu('overview')
  }

  function renderMenuRows(parentId: string | null, level: number): ReactNode {
    return menuChildren(menus, parentId, true).flatMap(item => [
      <tr key={item.id}>
        <td><div className={css.menuCell} style={{ paddingLeft: (level - 1) * 20 }}><span className={css.menuCellIcon}><Glyph kind={item.icon} size={16} /></span><span>{item.title}</span></div></td>
        <td><span className={css.levelBadge}>{level}</span></td>
        <td className={css.pathCell}>{item.path}</td>
        <td>{item.order}</td>
        <td><button type="button" className={item.hidden ? css.stateMuted : css.stateLive} onClick={() => commit(menus.map(menu => menu.id === item.id ? { ...menu, hidden: !menu.hidden } : menu))}>{t(item.hidden ? 'hidden' : 'visible')}</button></td>
        <td><div className={css.tableActions}>
          {level < 3 && <IconButton title={t('addChild')} onClick={() => openDraft(item.id)}>＋</IconButton>}
          <IconButton title={t('edit')} onClick={() => openDraft(item.parentId, item)}>{t('edit')}</IconButton>
          <IconButton title={t('remove')} onClick={() => removeMenu(item.id)} danger>{t('remove')}</IconButton>
        </div></td>
      </tr>,
      renderMenuRows(item.id, level + 1),
    ])
  }

  const statCards = [
    { label: t('statOrders'), value: '128', change: '+12.8%', icon: 'sales' },
    { label: t('statProducts'), value: '2,846', change: '+4.2%', icon: 'products' },
    { label: t('statStock'), value: '18,420', change: '+6.4%', icon: 'inventory' },
    { label: t('statWms'), value: '36', change: '8 / 28', icon: 'wms' },
  ]

  if (authRequired && !loggedIn) return null

  return <div className={css.shell}>
    <main className={css.main}>
      <header className={css.topbar}>
        <div className={css.crumb}><span>{t('brand')}</span><span className={css.crumbDivider}>/</span><span>{selectedToolItem?.label ?? (selectedId === 'overview' ? t('overview') : selectedId === 'menu-config' ? t('menuSettings') : chain.map(menu => menu.title).join(' / '))}</span></div>
        <div className={css.topActions}>
          <span className={css.demoPill}><span className={css.statusDot} />{t('demo')}</span>
          <button type="button" className={css.topButton} onClick={openChat}><Glyph kind="sparkles" size={16} />{t('mainChat')}</button>
          {authRequired && <div className={css.accountArea} ref={accountMenuRef}>
            <button type="button" className={css.accountTrigger} aria-label={t('accountMenu')} title={accountName} aria-expanded={accountMenuOpen} aria-controls={accountMenuId} onClick={() => { setAccountMenuOpen(open => !open); setProfileOpen(false) }}><span aria-hidden="true">{accountName.slice(0, 1).toUpperCase()}</span></button>
            {accountMenuOpen && <div className={css.accountPopover} id={accountMenuId}>
              <div className={css.accountIdentity}><span className={css.accountIdentityAvatar} aria-hidden="true">{accountName.slice(0, 1).toUpperCase()}</span><div><strong>{accountName}</strong><small>{t('demoAccount')}</small></div></div>
              <button type="button" className={css.accountAction} aria-expanded={profileOpen} aria-controls={profileId} onClick={() => setProfileOpen(open => !open)}><Glyph kind="admin" size={17} />{t('myProfile')}</button>
              {profileOpen && <div className={css.accountProfile} id={profileId}><div><span>{t('username')}</span><strong>{accountName}</strong></div><div><span>{t('loginMethod')}</span><strong>{t('loginDemo')}</strong></div></div>}
              <button type="button" className={[css.accountAction, css.accountSignOut].join(' ')} onClick={signOut}><Glyph kind="logout" size={17} />{t('signOut')}</button>
            </div>}
          </div>}
        </div>
      </header>
      <div className={css.content}>
        {selectedToolItem !== undefined ? <>
          <div className={css.pageHead}><div><span className={css.eyebrow}>{t('dataAndTools')}</span><h1>{selectedToolItem.label}</h1><p>{t('toolDescription')}</p></div><span className={css.demoPill}>{t('demo')}</span></div>
          <div className={css.toolPlaceholder}><span className={css.toolPlaceholderIcon}><Glyph kind={selectedToolItem.icon} size={28} /></span><h2>{selectedToolItem.label}</h2><p>{t('toolComingSoon')}</p></div>
        </> : selectedId === 'menu-config' ? <>
          <div className={css.pageHead}><div><span className={css.eyebrow}>{t('configEyebrow')}</span><h1>{t('configTitle')}</h1><p>{t('configDescription')}</p></div><div className={css.pageActions}><button type="button" className={css.secondaryButton} onClick={resetMenus}>{t('resetMenu')}</button><button type="button" className={css.primaryButton} onClick={() => openDraft(null)}>＋ {t('addMenu')}</button></div></div>
          <div className={css.tableCard}><div className={css.tableHead}><div><h2>{t('menuSettings')}</h2><p>{t('menuCount', { count: String(menus.length), place: t('localData') })}</p></div><span className={css.tableHeadMark}>01—03</span></div><div className={css.tableScroll}><table><thead><tr><th>{t('menuName')}</th><th>{t('level')}</th><th>{t('path')}</th><th>{t('order')}</th><th>{t('visibility')}</th><th>{t('actions')}</th></tr></thead><tbody>{renderMenuRows(null, 1)}</tbody></table></div></div>
          {error !== '' && draft === null && <p className={css.error}>{error}</p>}
        </> : selectedId === 'overview' || active === undefined ? <>
          <div className={css.hero}>
            <div><span className={css.eyebrow}>{t('heroEyebrow')}</span><h1>{t('heroTitle')}</h1><p>{t('heroDescription')}</p><div className={css.heroActions}><button type="button" className={css.primaryButton} onClick={() => navigate('menu-config')}>{t('startMenu')} <span>↗</span></button><button type="button" className={css.secondaryButton} onClick={() => navigate('product-sku')}>{t('viewProducts')}</button></div></div>
            <div className={css.heroArt} aria-hidden="true"><div className={css.artOrbit}><Glyph kind="warehouse" size={48} /></div><div className={css.artChipOne}><Glyph kind="products" size={20} /></div><div className={css.artChipTwo}><Glyph kind="sales" size={20} /></div><div className={css.artChipThree}><Glyph kind="wms" size={20} /></div></div>
          </div>
          <div className={css.stats}>{statCards.map(card => <div key={card.label} className={css.statCard}><div className={css.statTop}><span>{card.label}</span><span className={css.statIcon}><Glyph kind={card.icon} size={18} /></span></div><strong>{card.value}</strong><div className={css.statBottom}><span>{t('demoValue')}</span><span>{card.change}</span></div></div>)}</div>
          <WorkbenchTasks t={t} accountName={accountName} />
          <div className={css.bottomGrid}><div className={css.infoCard}><span className={css.cardKicker}>{t('flowKicker')}</span><h3>{t('flowTitle')}</h3><p>{t('flowDescription')}</p><div className={css.flow}>{[t('flowOne'), t('flowTwo'), t('flowThree'), t('flowFour')].map((step, index) => <span key={step}><i>{index + 1}</i>{step}{index < 3 && <b>→</b>}</span>)}</div></div><div className={css.infoCard}><span className={css.cardKicker}>{t('agentKicker')}</span><h3>{t('agentTitle')}</h3><p>{t('agentDescription')}</p><span className={css.soonTag}>{t('agentSoon')}</span></div></div>
        </> : <>
          <div className={css.pageHead}><div><span className={css.eyebrow}>{t('pageEyebrow')}</span><h1>{active.title}</h1><p>{table?.description ?? t('noRows')}</p></div><span className={css.demoPill}>{t('dataNotice')}</span></div>
          <div className={css.moduleSummary}><div className={css.summaryIcon}><Glyph kind={root?.icon ?? 'grid'} size={27} /></div><div><span>{root?.title}</span><strong>{active.title}</strong></div><div className={css.summaryTail}>{t('demoValue')}</div></div>
          <div className={css.tableCard}><div className={css.tableHead}><div><h2>{t('records')}</h2><p>{t('sampleOnly')}</p></div><span className={css.tableHeadMark}>{String(table?.rows.length ?? 0).padStart(2, '0')}</span></div>{table === undefined ? <div className={css.empty}>{t('noRows')}</div> : <div className={css.tableScroll}><table><thead><tr>{table.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{cell === row.length - 1 && /^(启用|在售|已完成|待发货|待收货|进行中|处理中|筹备中|待验收|草稿|采购中)$/.test(value) ? <span className={css.recordStatus}>{value}</span> : value}</td>)}</tr>)}</tbody></table></div>}</div>
          <div className={css.infoCard}><span className={css.cardKicker}>{t('nextKicker')}</span><h3>{t('quickGuide')}</h3><p>{t('quickGuideText')}</p></div>
        </>}
      </div>
    </main>
    {!chatOpen && <button type="button" className={css.chatFab} aria-label={t('openChat')} title={t('openChat')} onClick={openChat}><Glyph kind="sparkles" size={26} /></button>}
    {chatOpen && <section className={css.chatPopup} role="dialog" aria-modal="false" aria-label={t('mainChat')} onKeyDown={event => { if (event.key === 'Escape') closeChat() }}>
      <header className={css.chatPopupHead}>
        <span className={css.chatPopupIcon}><Glyph kind="sparkles" size={19} /></span>
        <span className={css.chatPopupTitle}><strong>{t('mainChat')}</strong><small>{t('chatDemoStatus')}</small></span>
        <button type="button" className={css.chatPopupClose} aria-label={t('closeChat')} onClick={closeChat}>×</button>
      </header>
      <div className={css.chatPopupBody}>
        {chatReference === null
          ? <div className={css.chatPopupState}>{t(chatStatus === 'loading' ? 'chatConnecting' : chatStatus === 'no-workspace' ? 'chatNoWorkspace' : 'chatLoadFailed')}</div>
          : <SessionProvider session={chatReference}>{renderSlot('erp.chat.conversation', {})}</SessionProvider>}
      </div>
    </section>}
    {draft !== null && <div className={css.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) { setDraft(null); setError('') } }}><form className={css.modal} onSubmit={saveDraft}>
      <div className={css.modalHead}><div><span className={css.eyebrow}>{t('menuSettings')}</span><h2>{t(draft.id === null ? 'addMenu' : 'editMenu')}</h2></div><button type="button" className={css.closeButton} onClick={() => { setDraft(null); setError('') }} aria-label={t('cancel')}>×</button></div>
      <p className={css.formTip}>{t('formTip')}</p>
      <div className={css.formGrid}>
        <label className={css.fullField}><span>{t('menuName')}</span><input autoFocus value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
        <label><span>{t('parentMenu')}</span><select value={draft.parentId ?? ''} disabled={draft.id !== null} onChange={event => setDraft({ ...draft, parentId: event.target.value || null })}><option value="">{t('rootMenu')}</option>{menus.filter(menu => menu.id !== draft.id && menuDepth(menus, menu.id) < 3).map(menu => <option key={menu.id} value={menu.id}>{'　'.repeat(menuDepth(menus, menu.id) - 1)}{menu.title}</option>)}</select></label>
        <label><span>{t('icon')}</span><select value={draft.icon} onChange={event => setDraft({ ...draft, icon: event.target.value })}>{iconOptions.map(icon => <option key={icon} value={icon}>{t(iconKeys[icon])}</option>)}</select></label>
        <label className={css.fullField}><span>{t('path')}</span><input value={draft.path} onChange={event => setDraft({ ...draft, path: event.target.value })} /></label>
        <label><span>{t('order')}</span><input type="number" value={draft.order} onChange={event => setDraft({ ...draft, order: event.target.value })} /></label>
        <label><span>{t('visibility')}</span><select value={draft.hidden ? 'hidden' : 'visible'} onChange={event => setDraft({ ...draft, hidden: event.target.value === 'hidden' })}><option value="visible">{t('visible')}</option><option value="hidden">{t('hidden')}</option></select></label>
      </div>
      {error !== '' && <p className={css.error}>{error}</p>}
      <div className={css.modalActions}><button type="button" className={css.secondaryButton} onClick={() => { setDraft(null); setError('') }}>{t('cancel')}</button><button type="submit" className={css.primaryButton}>{t('save')}</button></div>
    </form></div>}
  </div>
}
