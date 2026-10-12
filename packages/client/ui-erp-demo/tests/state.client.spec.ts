// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createErpState, loadMainView, saveMainView } from '../src/client/state.ts'

afterEach(() => { localStorage.clear() })

describe('ERP page restoration', () => {
  it('restores the selected menu after a new state is created', () => {
    createErpState().selectMenu('product-sku')
    expect(createErpState().getSnapshot()).toMatchObject({ selectedId: 'product-sku', selectedTool: null })
  })

  it('restores a tool and ignores a removed menu', () => {
    createErpState().selectTool('skills')
    expect(createErpState().getSnapshot()).toMatchObject({ selectedId: 'overview', selectedTool: 'skills' })
    localStorage.setItem('dsh-erp-demo.page.v1', JSON.stringify({ selectedId: 'removed', selectedTool: null }))
    expect(createErpState().getSnapshot()).toMatchObject({ selectedId: 'overview', selectedTool: null })
  })

  it('remembers whether the main view is ERP or Conversation', () => {
    expect(loadMainView()).toBe('erp')
    saveMainView('conversation')
    expect(loadMainView()).toBe('conversation')
  })
})
