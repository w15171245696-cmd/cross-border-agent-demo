/** ERP navigation inserted above the existing DSH workspace browser. */
import { useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Glyph, BrandLogo } from './ErpPage.tsx'
import { menuChain, menuChildren, type ErpMenu } from './model.ts'
import type { ErpState, ToolId } from './state.ts'
import type { ErpLocaleKey } from './locales.ts'
import css from './ErpSidebar.module.css'

type Props = PropsRuntime<'sidebar.erp-navigation'> & PropsLocale<'erpDemo'> & {
  erp: ErpState
  showErp: () => void
}

export function ErpSidebar({ wide, expandSidebar, t, erp, showErp }: Props): ReactNode {
  const { menus, selectedId, selectedTool } = useSyncExternalStore(erp.subscribe, erp.getSnapshot)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(
    menuChain(menus, selectedId).slice(0, -1).map(menu => menu.id),
  ))
  const chooseMenu = (id: string): void => {
    erp.selectMenu(id)
    showErp()
  }
  const chooseTool = (id: ToolId): void => {
    erp.selectTool(id)
    showErp()
  }
  const toggle = (id: string): void => {
    setExpanded(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const renderMenus = (parentId: string | null, level: number): ReactNode =>
    menuChildren(menus, parentId).map((item: ErpMenu) => {
      const children = menuChildren(menus, item.id)
      const open = expanded.has(item.id)
      return <div key={item.id} className={css.group}>
        <div className={css.row} data-level={level} data-selected={selectedTool === null && selectedId === item.id || undefined}>
          <button type="button" className={css.select} title={item.title} onClick={() => chooseMenu(item.id)}>
            {level === 1 && <Glyph kind={item.icon} size={17} />}
            {level === 3 && <span className={css.dot} />}
            <span className={css.label}>{item.title}</span>
          </button>
          {children.length > 0 && <button type="button" className={css.toggle} aria-label={t(open ? 'collapseMenu' : 'expandMenu', { name: item.title })} aria-expanded={open} onClick={() => toggle(item.id)}><span className={open ? css.open : undefined}>⌄</span></button>}
        </div>
        {children.length > 0 && open && <div className={css.children}>{renderMenus(item.id, level + 1)}</div>}
      </div>
    })

  if (!wide) return <button type="button" className={css.railButton} title={t('brand')} aria-label={t('brand')} onClick={() => { expandSidebar(); showErp() }}><BrandLogo size={22} /></button>

  return <section className={css.root} aria-label={t('brand')}>
    <div className={css.heading}>{t('workspace')}</div>
    <div className={css.scroll}>
      <button type="button" className={css.overview} data-selected={selectedTool === null && selectedId === 'overview' || undefined} onClick={() => chooseMenu('overview')}><Glyph kind="dashboard" size={18} /><span>{t('overview')}</span></button>
      {renderMenus(null, 1)}
    </div>
    <div className={css.toolsHeading}>{t('dataAndTools')}</div>
    {([['database', 'database'], ['skills', 'skills']] as const).map(([id, icon]) =>
      <button type="button" key={id} className={css.tool} data-selected={selectedTool === id || undefined} onClick={() => chooseTool(id)}><Glyph kind={icon} size={17} /><span>{t(id as ErpLocaleKey)}</span></button>)}
  </section>
}
