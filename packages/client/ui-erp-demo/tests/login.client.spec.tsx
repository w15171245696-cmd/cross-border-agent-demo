// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createDemoAuthState } from '../src/client/demoState.ts'
import { ErpLoginPage } from '../src/client/ErpLoginPage.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function mountLogin() {
  const showErp = vi.fn()
  let activePanelId: string | null = null
  const props = {
    auth: createDemoAuthState(),
    showErp,
    erpPanelId: 'erp-demo',
    usePanelInfo: (selector: (info: { activePanelId: string | null }) => unknown) => selector({ activePanelId }),
    t: (key: keyof typeof zh) => zh[key],
  } as unknown as Parameters<typeof ErpLoginPage>[0]
  const view = render(<ErpLoginPage {...props} />)
  return {
    showErp,
    setPanel(id: string | null) {
      activePanelId = id
      view.rerender(<ErpLoginPage {...props} />)
    },
  }
}

describe('ERP login landing', () => {
  it('opens the workbench after a successful sign-in', () => {
    const { showErp } = mountLogin()
    fireEvent.change(screen.getByPlaceholderText(zh.passwordPlaceholder), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /登录/ }))
    expect(showErp).toHaveBeenCalledTimes(1)
    expect(showErp).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog', { name: zh.loginTitle })).toBeNull()
  })

  it('opens the workbench when a saved login skips the form', () => {
    localStorage.setItem('dsh-erp-demo.login.v1', 'admin')
    const { showErp } = mountLogin()
    expect(screen.queryByRole('dialog', { name: zh.loginTitle })).toBeNull()
    expect(showErp).toHaveBeenCalledTimes(1)
    expect(showErp).toHaveBeenCalledWith(false)
  })

  it('keeps the conversation selected after a reload', () => {
    localStorage.setItem('dsh-erp-demo.login.v1', 'admin')
    localStorage.setItem('dsh-erp-demo.main-view.v1', 'conversation')
    const { showErp } = mountLogin()
    expect(showErp).not.toHaveBeenCalled()
    expect(localStorage.getItem('dsh-erp-demo.main-view.v1')).toBe('conversation')
  })

  it('remembers an explicit switch from ERP to Conversation', () => {
    localStorage.setItem('dsh-erp-demo.login.v1', 'admin')
    const { setPanel } = mountLogin()
    setPanel('erp-demo')
    setPanel(null)
    expect(localStorage.getItem('dsh-erp-demo.main-view.v1')).toBe('conversation')
  })
})
