/** ERP brand occupants for the shared sidebar slots. */
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { BrandLogo } from './ErpPage.tsx'

/**
 * Render the ERP mark at the sidebar's requested size.
 * @param props - Sidebar mark size.
 * @returns The blue-purple ERP mark.
 */
export function ErpBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <BrandLogo size={size} />
}

/**
 * Render the localized ERP product name.
 * @param props - ERP locale helper.
 * @returns The sidebar brand name.
 */
export function ErpBrandName({ t }: PropsLocale<'erpDemo'>) {
  return <span>{t('brand')}</span>
}
