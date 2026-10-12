// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createDemoAuthState } from '../src/client/demoState.ts'
import { ErpPage } from '../src/client/ErpPage.tsx'
import { zh } from '../src/client/locales.ts'
import { createErpState } from '../src/client/state.ts'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})

describe('ERP workbench date', () => {
  it('uses the current date and updates after midnight while preserving the sample time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 12, 23, 59, 58))
    const props = {
      erp: createErpState(),
      auth: createDemoAuthState(),
      authRequired: false,
      acquireChat: vi.fn(),
      t: (key: keyof typeof zh) => zh[key],
    } as unknown as Parameters<typeof ErpPage>[0]

    render(<ErpPage {...props} />)
    expect(screen.getByRole('heading', { name: zh.dailyGreeting + zh.demoAccount })).toBeTruthy()
    expect(within(screen.getByRole('region', { name: zh.myTodos })).getByText('06')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: zh.unreadNotifications })).getByText('06')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: zh.subordinatePending })).getByText('07')).toBeTruthy()
    expect(screen.getAllByText('2026/10/12').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2026-10-12 09:05:10/).length).toBeGreaterThan(0)

    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getAllByText('2026/10/13').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2026-10-13 09:05:10/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/2026-10-12 09:05:10/)).toBeNull()
  })
})

describe('ERP workbench todos', () => {
  const renderWorkbench = () => {
    const props = {
      erp: createErpState(),
      auth: createDemoAuthState(),
      authRequired: false,
      acquireChat: vi.fn(),
      t: (key: keyof typeof zh) => zh[key],
    } as unknown as Parameters<typeof ErpPage>[0]
    return { ...render(<ErpPage {...props} />), props }
  }

  const taskButton = (title: string) => {
    const article = screen.getByRole('heading', { name: title }).closest('article')
    expect(article).not.toBeNull()
    return within(article as HTMLElement).getByRole('button')
  }

  it('confirms start, then completes the task only for this page visit', () => {
    const { unmount, props } = renderWorkbench()
    const todos = screen.getByRole('region', { name: zh.myTodos })
    expect(within(todos).getByText('06')).toBeTruthy()

    fireEvent.click(taskButton(zh.todoActiveListing))
    let dialog = screen.getByRole('dialog', { name: zh.confirmStartTask })
    expect(within(dialog).getByText(zh.todoActiveListing)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: zh.cancel }))
    expect(taskButton(zh.todoActiveListing).textContent).toContain(zh.startTask)

    fireEvent.click(taskButton(zh.todoActiveListing))
    dialog = screen.getByRole('dialog', { name: zh.confirmStartTask })
    fireEvent.click(within(dialog).getByRole('button', { name: zh.confirmStart }))
    expect(taskButton(zh.todoActiveListing).textContent).toContain(zh.finishTask)
    expect(within(todos).getByText('06')).toBeTruthy()

    fireEvent.click(taskButton(zh.todoActiveListing))
    dialog = screen.getByRole('dialog', { name: zh.confirmFinishTask })
    const restored = within(dialog).getByRole('checkbox', { name: zh.resultRestoredListing }) as HTMLInputElement
    expect(restored.checked).toBe(true)
    expect(within(dialog).getByRole('checkbox', { name: zh.resultInventoryHandled })).toBeTruthy()
    fireEvent.click(restored)
    expect((within(dialog).getByRole('button', { name: zh.confirmFinish }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(within(dialog).getByRole('checkbox', { name: zh.resultInventoryHandled }))
    fireEvent.change(within(dialog).getByRole('textbox', { name: zh.taskResultDescription }), { target: { value: '已核对库存' } })
    fireEvent.click(within(dialog).getByRole('button', { name: zh.cancel }))
    expect(taskButton(zh.todoActiveListing).textContent).toContain(zh.finishTask)

    fireEvent.click(taskButton(zh.todoActiveListing))
    dialog = screen.getByRole('dialog', { name: zh.confirmFinishTask })
    fireEvent.click(within(dialog).getByRole('button', { name: zh.confirmFinish }))
    expect(screen.queryByRole('heading', { name: zh.todoActiveListing })).toBeNull()
    expect(within(todos).getByText('05')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: zh.unreadNotifications })).getByText('06')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: zh.subordinatePending })).getByText('07')).toBeTruthy()

    unmount()
    render(<ErpPage {...props} />)
    expect(within(screen.getByRole('region', { name: zh.myTodos })).getByText('06')).toBeTruthy()
    expect(taskButton(zh.todoActiveListing).textContent).toContain(zh.startTask)
  })

  it.each([
    [zh.todoCartListing, zh.resultCartRestored],
    [zh.todoSellerListing, zh.resultSellerGone],
    [zh.todoStoreFeedback, zh.resultCannotDelete],
    [zh.todoCategoryListing, zh.resultCannotChangeCategory],
    [zh.todoVisualImage, zh.resultImageHandled],
  ])('shows the matching completion result for %s', (title, result) => {
    renderWorkbench()
    fireEvent.click(taskButton(title))
    fireEvent.click(within(screen.getByRole('dialog', { name: zh.confirmStartTask })).getByRole('button', { name: zh.confirmStart }))
    fireEvent.click(taskButton(title))
    const dialog = screen.getByRole('dialog', { name: zh.confirmFinishTask })
    expect((within(dialog).getByRole('checkbox', { name: result }) as HTMLInputElement).checked).toBe(true)
  })
})

describe('ERP workbench notification details', () => {
  const renderWorkbench = () => {
    const props = {
      erp: createErpState(),
      auth: createDemoAuthState(),
      authRequired: false,
      acquireChat: vi.fn(),
      t: (key: keyof typeof zh) => zh[key],
    } as unknown as Parameters<typeof ErpPage>[0]
    render(<ErpPage {...props} />)
  }

  const openDetail = (title: string) => {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(title) }))
    return screen.getByRole('dialog')
  }

  it('shows account warning metrics and closes without changing any counts', () => {
    renderWorkbench()
    const dialog = openDetail(zh.notificationAccount)
    expect(within(dialog).getByRole('heading', { name: zh.notificationAccountDetailTitle })).toBeTruthy()
    expect(within(dialog).getByText(zh.notificationAccountIntro)).toBeTruthy()
    expect(within(dialog).getByText(zh.notificationIpInfringement)).toBeTruthy()
    expect(within(dialog).getAllByText('0.00%').length).toBe(2)
    fireEvent.click(within(dialog).getByRole('button', { name: zh.closeNotification }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(within(screen.getByRole('region', { name: zh.unreadNotifications })).getByText('06')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: zh.myTodos })).getByText('06')).toBeTruthy()
  })

  it.each([
    [zh.notificationSaleDate, zh.notificationSaleDateMessage],
    [zh.notificationReview, zh.notificationReviewComment],
    [zh.notificationArrival, zh.notificationArrivalMessage],
    [zh.notificationCapacity, zh.notificationCapacityMessage],
    [zh.notificationStockout, zh.notificationStockoutMessage],
  ])('shows the matching details for %s', (title, message) => {
    renderWorkbench()
    const dialog = openDetail(title)
    expect(within(dialog).getByRole('heading', { name: title })).toBeTruthy()
    expect(within(dialog).getByText(message)).toBeTruthy()
    expect(within(dialog).getByText(/09:05:10/)).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('ERP account menu', () => {
  it('shows the signed-in account and places sign out in the avatar menu', () => {
    const auth = createDemoAuthState()
    auth.signIn('admin', '123456')
    const props = {
      erp: createErpState(),
      auth,
      authRequired: true,
      acquireChat: vi.fn(),
      t: (key: keyof typeof zh) => zh[key],
    } as unknown as Parameters<typeof ErpPage>[0]

    render(<ErpPage {...props} />)
    expect(screen.getByRole('heading', { name: zh.dailyGreeting + 'admin' })).toBeTruthy()
    expect(createDemoAuthState().getUsernameSnapshot()).toBe('admin')
    expect(screen.queryByRole('button', { name: zh.signOut })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: zh.accountMenu }))
    expect(screen.getByText(zh.demoAccount)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: zh.myProfile }))
    expect(screen.getByText(zh.loginDemo)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: zh.signOut }))
    expect(auth.getSnapshot()).toBe(false)
  })
})

describe('ERP restored pages', () => {
  it('renders menu settings after restoring that selection', () => {
    createErpState().selectMenu('menu-config')
    const props = {
      erp: createErpState(),
      auth: createDemoAuthState(),
      authRequired: false,
      acquireChat: vi.fn(),
      t: (key: keyof typeof zh) => zh[key],
    } as unknown as Parameters<typeof ErpPage>[0]

    render(<ErpPage {...props} />)

    expect(screen.getByRole('heading', { level: 1, name: zh.configTitle })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: zh.heroTitle })).toBeNull()
  })
})
