/** Demo-only menu and sample records. No server or DSH Session owns these values. */
export interface ErpMenu {
  id: string
  parentId: string | null
  title: string
  path: string
  icon: string
  order: number
  hidden: boolean
}

/** Fixed example records shown in one ERP module. */
export interface DemoTable {
  description: string
  columns: readonly string[]
  rows: readonly (readonly string[])[]
}

/** Browser storage key for editable ERP navigation. */
export const MENU_STORAGE_KEY = 'dsh-erp-demo.menus.v1'

const root = (id: string, title: string, order: number, icon: string): ErpMenu => ({
  id, parentId: null, title, path: `/${id}`, icon, order, hidden: false,
})
const parentPaths: Readonly<Record<string, string>> = {
  'sales-orders': '/sales/sales-orders',
  'product-catalog': '/products/product-catalog',
}
const child = (id: string, parentId: string, title: string, order: number): ErpMenu => ({
  id, parentId, title, path: `${parentPaths[parentId] ?? `/${parentId}`}/${id}`, icon: 'grid', order, hidden: false,
})

/** Default navigation, with both second- and third-level destinations. */
export const DEFAULT_MENUS: readonly ErpMenu[] = [
  root('sales', '销售', 10, 'sales'),
  child('sales-overview', 'sales', '销售概览', 10),
  child('sales-orders', 'sales', '订单管理', 20),
  child('sales-order-list', 'sales-orders', '订单列表', 10),
  child('sales-returns', 'sales-orders', '售后订单', 20),
  root('products', '产品', 20, 'products'),
  child('product-catalog', 'products', '商品管理', 10),
  child('product-spu', 'product-catalog', 'SPU 商品', 10),
  child('product-sku', 'product-catalog', 'SKU 商品', 20),
  child('product-category', 'products', '商品分类', 20),
  root('warehouses', '仓库', 30, 'warehouse'),
  child('warehouse-list', 'warehouses', '仓库档案', 10),
  child('warehouse-locations', 'warehouses', '库区与库位', 20),
  root('procurement', '采购', 40, 'procurement'),
  child('supplier-list', 'procurement', '供应商管理', 10),
  child('purchase-orders', 'procurement', '采购订单', 20),
  root('inventory', '库存', 50, 'inventory'),
  child('inventory-overview', 'inventory', '库存总览', 10),
  child('inventory-ledger', 'inventory', '库存流水', 20),
  child('inventory-adjustments', 'inventory', '库存调整', 30),
  root('wms', 'WMS', 60, 'wms'),
  child('wms-receiving', 'wms', '入库管理', 10),
  child('wms-putaway', 'wms', '上架管理', 20),
  child('wms-picking', 'wms', '拣货管理', 30),
  child('wms-shipping', 'wms', '出库管理', 40),
  root('administration', '基础管理', 70, 'admin'),
  child('admin-users', 'administration', '用户管理', 10),
  child('admin-departments', 'administration', '部门管理', 20),
  child('admin-roles', 'administration', '角色与权限', 30),
  root('settings', '系统设置', 80, 'settings'),
  child('menu-config', 'settings', '菜单配置', 10),
  child('system-dictionaries', 'settings', '数据字典', 20),
  child('system-parameters', 'settings', '系统参数', 30),
]

/** Small fixed examples make every section readable before an API exists. */
export const MODULE_TABLES: Readonly<Record<string, DemoTable>> = {
  sales: {
    description: '订单数据演示。后续可接入店铺、平台、支付与售后流程。',
    columns: ['订单号', '渠道', '客户', '金额', '状态'],
    rows: [
      ['SO-20261010-001', 'Amazon US', 'Northbay Retail', '$128.00', '待发货'],
      ['SO-20261010-002', 'Shopify', 'Olivia Chen', '$84.50', '已完成'],
      ['SO-20261010-003', 'Amazon UK', 'Marble Studio', '£216.00', '处理中'],
    ],
  },
  products: {
    description: '商品与变体数据演示。后续可扩展图片、属性、渠道刊登与价格规则。',
    columns: ['SKU', '商品名称', '分类', '售价', '状态'],
    rows: [
      ['HL-1001-BK', '旅行收纳套装 · 黑色', '旅行用品', '$29.90', '在售'],
      ['HL-1002-WH', '桌面收纳架 · 白色', '家居收纳', '$42.00', '在售'],
      ['HL-1003-GY', '便携水杯 · 灰色', '户外用品', '$18.50', '草稿'],
    ],
  },
  warehouses: {
    description: '仓库及库位主数据演示。',
    columns: ['仓库编码', '仓库名称', '地区', '库位数', '状态'],
    rows: [
      ['WH-US-01', '洛杉矶海外仓', '美国 · 加州', '240', '启用'],
      ['WH-CN-01', '深圳中心仓', '中国 · 深圳', '580', '启用'],
      ['WH-UK-01', '伦敦海外仓', '英国 · 伦敦', '160', '筹备中'],
    ],
  },
  procurement: {
    description: '采购与供应商数据演示。',
    columns: ['采购单号', '供应商', 'SKU 数', '预计到货', '状态'],
    rows: [
      ['PO-202610-018', '海川供应链', '12', '2026-10-18', '待收货'],
      ['PO-202610-017', '优品制造', '8', '2026-10-15', '采购中'],
      ['PO-202610-016', '东岭包装', '4', '2026-10-12', '已完成'],
    ],
  },
  inventory: {
    description: '按商品与仓库查看库存数量的演示视图。',
    columns: ['SKU', '仓库', '在库量', '占用量', '可用量'],
    rows: [
      ['HL-1001-BK', '洛杉矶海外仓', '640', '28', '612'],
      ['HL-1002-WH', '深圳中心仓', '1,280', '105', '1,175'],
      ['HL-1003-GY', '伦敦海外仓', '390', '12', '378'],
    ],
  },
  wms: {
    description: '仓内作业流程演示，覆盖入库、上架、拣货与出库。',
    columns: ['作业单号', '作业类型', '仓库', '负责人', '状态'],
    rows: [
      ['WMS-IN-0182', '入库', '深圳中心仓', '陈晓', '待验收'],
      ['WMS-PK-0341', '拣货', '洛杉矶海外仓', 'Alex', '进行中'],
      ['WMS-OUT-0309', '出库', '洛杉矶海外仓', 'Mia', '已完成'],
    ],
  },
  administration: {
    description: '组织、用户与角色的展示页面；真实权限校验待后续接入。',
    columns: ['用户名', '部门', '角色', '最近登录', '状态'],
    rows: [
      ['admin', '管理中心', '管理员', '2026-10-10', '启用'],
      ['sales.demo', '销售部', '销售专员', '2026-10-09', '启用'],
      ['wms.demo', '仓储部', '仓库操作员', '2026-10-08', '启用'],
    ],
  },
  settings: {
    description: '全局字典、参数与菜单配置的演示入口。',
    columns: ['配置编码', '配置名称', '示例值', '类型', '状态'],
    rows: [
      ['system.timezone', '默认时区', 'Asia/Shanghai', '系统参数', '启用'],
      ['currency.default', '默认币种', 'USD', '数据字典', '启用'],
      ['menu.depth', '菜单最大层级', '3', '菜单参数', '启用'],
    ],
  },
}

/**
 * Return one level of menu children in configured order.
 * @param menus - Current menu definitions.
 * @param parentId - Parent to inspect, or null for root entries.
 * @param includeHidden - Include entries hidden from navigation.
 * @returns Matching children in display order.
 */
export function menuChildren(menus: readonly ErpMenu[], parentId: string | null, includeHidden = false): ErpMenu[] {
  return menus.filter(menu => menu.parentId === parentId && (includeHidden || !menu.hidden))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

/**
 * Resolve the ancestor chain, including the selected node.
 * @param menus - Current menu definitions.
 * @param id - Selected menu id.
 * @returns The chain from root to selected node.
 */
export function menuChain(menus: readonly ErpMenu[], id: string): ErpMenu[] {
  const chain: ErpMenu[] = []
  let current = menus.find(menu => menu.id === id)
  while (current !== undefined && chain.length < 3) {
    chain.unshift(current)
    current = current.parentId === null ? undefined : menus.find(menu => menu.id === current?.parentId)
  }
  return chain
}

/**
 * Count menu levels from one for a root entry.
 * @param menus - Current menu definitions.
 * @param id - Menu id to measure.
 * @returns The depth of its resolved ancestor chain.
 */
export function menuDepth(menus: readonly ErpMenu[], id: string): number {
  return menuChain(menus, id).length
}

/**
 * Find a node and all descendants for a cascade removal.
 * @param menus - Current menu definitions.
 * @param id - Root id of the removal.
 * @returns Ids to remove together.
 */
export function descendantIds(menus: readonly ErpMenu[], id: string): Set<string> {
  const ids = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    for (const menu of menus) {
      if (menu.parentId !== null && ids.has(menu.parentId) && !ids.has(menu.id)) {
        ids.add(menu.id)
        changed = true
      }
    }
  }
  return ids
}

/**
 * Parse browser-local menu drafts; invalid data falls back to defaults.
 * @returns Stored menus or a copy of the default menus.
 */
export function loadMenus(): ErpMenu[] {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY)
    if (raw === null) return DEFAULT_MENUS.map(item => ({ ...item }))
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || !value.every(isErpMenu)) throw new Error('Invalid menu data')
    const menus = value as ErpMenu[]
    if (new Set(menus.map(menu => menu.id)).size !== menus.length) throw new Error('Duplicate menu ids')
    return menus
  } catch {
    return DEFAULT_MENUS.map(item => ({ ...item }))
  }
}

function isErpMenu(value: unknown): value is ErpMenu {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && (typeof item.parentId === 'string' || item.parentId === null)
    && typeof item.title === 'string' && typeof item.path === 'string'
    && typeof item.icon === 'string' && typeof item.order === 'number' && typeof item.hidden === 'boolean'
}

/**
 * Persist the local navigation prototype.
 * @param menus - Menu definitions to save.
 * @returns Whether browser storage accepted the update.
 */
export function saveMenus(menus: readonly ErpMenu[]): boolean {
  try {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menus))
    return true
  } catch {
    return false
  }
}
