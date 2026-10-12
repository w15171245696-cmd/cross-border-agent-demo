/** Standalone browser-local login gate for the ERP demo Web profile. */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { DemoAuthState } from './demoState.ts'
import { loadMainView, saveMainView } from './state.ts'
import { BrandLogo } from './ErpPage.tsx'
import css from './ErpPage.module.css'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<'erpDemo'> & {
  auth: DemoAuthState
  showErp: (freshLogin: boolean) => void
  erpPanelId: MainPanelId
}

export function ErpLoginPage({ t, auth, showErp, erpPanelId, usePanelInfo }: Props): ReactNode {
  const loggedIn = useSyncExternalStore(auth.subscribe, auth.getSnapshot)
  const activePanelId = usePanelInfo(info => info.activePanelId)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const initiallyLoggedIn = useRef(loggedIn)
  const initialMainView = useRef(loadMainView())
  const restoringErp = useRef(initiallyLoggedIn.current && initialMainView.current === 'erp')

  useEffect(() => {
    if (loggedIn) return
    const overlay = document.querySelector('[data-shell-overlay]')
    const siblings = overlay === null ? [] : Array.from(overlay.parentElement?.children ?? [])
      .filter(element => element !== overlay).map(element => ({ element: element as HTMLElement, inert: (element as HTMLElement).inert }))
    siblings.forEach(({ element }) => { element.inert = true })
    return () => { siblings.forEach(({ element, inert }) => { element.inert = inert }) }
  }, [loggedIn])

  useLayoutEffect(() => {
    if (restoringErp.current) showErp(false)
  }, [showErp])

  useEffect(() => {
    if (!loggedIn || (restoringErp.current && activePanelId === null)) return
    restoringErp.current = false
    saveMainView(activePanelId === erpPanelId ? 'erp' : 'conversation')
  }, [activePanelId, erpPanelId, loggedIn])

  if (loggedIn) return null

  function signIn(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!auth.signIn(username, password)) {
      setLoginError(t('loginInvalid'))
      return
    }
    setPassword('')
    setLoginError('')
    showErp(true)
  }

  return createPortal(<div className={css.loginShell} role="dialog" aria-modal="true" aria-label={t('loginTitle')}>
    <div className={css.loginCard}>
      <div className={css.loginBrand}><BrandLogo size={44} /><div><strong>{t('brand')}</strong><span>{t('loginDemo')}</span></div></div>
      <span className={css.eyebrow}>{t('loginEyebrow')}</span>
      <h1>{t('loginTitle')}</h1>
      <p>{t('loginDescription')}</p>
      <form className={css.loginForm} onSubmit={signIn}>
        <label><span>{t('username')}</span><input autoFocus autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} /></label>
        <label><span>{t('password')}</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t('passwordPlaceholder')} /></label>
        {loginError !== '' && <p role="alert" className={css.error}>{loginError}</p>}
        <button type="submit" className={css.loginButton}>{t('signIn')} <span>→</span></button>
      </form>
      <div className={css.loginHint}>{t('loginHint')}</div>
    </div>
  </div>, document.body)
}
